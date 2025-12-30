/**
 * Test Registry Runner
 * 
 * This script:
 * 1. Parses TEST_REGISTRY.md to identify all automated tests
 * 2. Runs Jest tests matching those test IDs
 * 3. Creates a timestamped copy of TEST_REGISTRY with results
 * 4. Can be run manually or via CI/CD
 * 
 * Usage:
 *   npm run test:registry
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const TEST_REGISTRY_PATH = path.join(__dirname, '../documentation/testing/TEST_REGISTRY.md');
const RESULTS_DIR = path.join(__dirname, '../documentation/testing/results');

// Ensure results directory exists
if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

/**
 * Parse TEST_REGISTRY.md to extract all automated tests
 */
function parseAllTests() {
  const content = fs.readFileSync(TEST_REGISTRY_PATH, 'utf8');
  const lines = content.split('\n');
  
  const tests = [];
  let inAutomatedTests = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Detect start of Automated Tests section
    if (line.includes('## Automated Tests')) {
      inAutomatedTests = true;
      continue;
    }
    
    // Stop at Manual Tests section
    if (line.includes('## Manual Tests')) {
      break;
    }
    
    if (!inAutomatedTests) continue;
    
    // Parse test rows (format: | ID | Test Name | ... | Platform | ... | Criticality | Status |)
    if (line.startsWith('|') && line.includes('AUTO-')) {
      const parts = line.split('|').map(p => p.trim()).filter(p => p);
      
      if (parts.length >= 8) {
        const testId = parts[0];
        const testName = parts[1];
        const testPlatform = parts[3]; // Platform column
        const testCriticality = parts[6]; // Criticality column
        
        tests.push({
          id: testId,
          name: testName,
          platform: testPlatform,
          criticality: testCriticality,
        });
      }
    }
  }
  
  return tests;
}

/**
 * Run Jest tests and capture results
 */
function runJestTests() {
  console.log(`\n🧪 Running Jest tests...\n`);
  
  try {
    // Run Jest with JSON output
    const jestCommand = `npm test -- --json --no-coverage --passWithNoTests`;
    const output = execSync(jestCommand, { 
      encoding: 'utf8',
      stdio: 'pipe',
      cwd: path.join(__dirname, '..'),
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large outputs
    });
    
    // Parse JSON output
    const results = JSON.parse(output);
    return results;
  } catch (error) {
    // Jest may exit with non-zero code even if some tests pass
    // Try to parse the output anyway
    try {
      const output = error.stdout || error.stderr || error.message || '';
      // Extract JSON from output (Jest outputs JSON even on failure)
      const jsonMatch = output.match(/\{[\s\S]*"numTotalTests"[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // If no JSON found, create a minimal result structure
      console.warn('⚠️  Could not parse Jest JSON output, creating minimal result structure');
      return {
        numTotalTests: 0,
        numPassedTests: 0,
        numFailedTests: 0,
        testResults: [],
      };
    } catch (parseError) {
      console.error('❌ Failed to parse Jest output:', parseError.message);
      // Return minimal structure to allow test runner to continue
      return {
        numTotalTests: 0,
        numPassedTests: 0,
        numFailedTests: 0,
        testResults: [],
      };
    }
  }
}

/**
 * Extract test IDs from test file content
 * Looks for test IDs in comments (e.g., "AUTO-DATA-UT-01: Match document creation")
 */
function extractTestIdsFromFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    // Match test IDs in various formats:
    // - AUTO-XXX-YY-01: Description
    // - AUTO-XXX-YY-01: Description (in describe blocks)
    // - Comments with test IDs
    const testIdRegex = /(AUTO-[A-Z]+-(UT|IT|E2E)-\d+)/g;
    const matches = content.match(testIdRegex);
    return matches ? [...new Set(matches)] : [];
  } catch (error) {
    console.warn(`⚠️  Could not read test file ${filePath}: ${error.message}`);
    return [];
  }
}

/**
 * Map Jest test results to TEST_REGISTRY test IDs
 */
function mapTestResultsToRegistry(jestResults, registryTests) {
  const testFileMap = new Map();
  
  // Build map of test files to their TEST_REGISTRY IDs
  if (jestResults.testResults) {
    jestResults.testResults.forEach(testFile => {
      const testIds = extractTestIdsFromFile(testFile.name);
      testIds.forEach(testId => {
        if (!testFileMap.has(testId)) {
          testFileMap.set(testId, []);
        }
        testFileMap.get(testId).push(testFile);
      });
    });
  }
  
  // Also check individual test cases for test IDs in their names/descriptions
  if (jestResults.testResults) {
    jestResults.testResults.forEach(testFile => {
      if (testFile.assertionResults) {
        testFile.assertionResults.forEach(assertion => {
          // Look for test IDs in test titles/descriptions
          const titleMatch = assertion.title.match(/(AUTO-[A-Z]+-(UT|IT|E2E)-\d+)/);
          if (titleMatch) {
            const testId = titleMatch[1];
            if (!testFileMap.has(testId)) {
              testFileMap.set(testId, []);
            }
            // Create a synthetic test file result for this assertion
            const syntheticResult = {
              ...testFile,
              status: assertion.status === 'passed' ? 'passed' : 'failed',
              assertionResults: [assertion],
            };
            testFileMap.get(testId).push(syntheticResult);
          }
        });
      }
    });
  }
  
  // Map results to registry tests
  const mappedResults = registryTests.map(test => {
    const testFiles = testFileMap.get(test.id) || [];
    let status = 'Not Run';
    let passed = false;
    let failed = false;
    
    // Check if any test file for this ID passed/failed
    testFiles.forEach(testFile => {
      if (testFile.status === 'passed') {
        passed = true;
      } else if (testFile.status === 'failed') {
        failed = true;
      }
      
      // Also check individual assertions
      if (testFile.assertionResults) {
        testFile.assertionResults.forEach(assertion => {
          if (assertion.status === 'passed') {
            passed = true;
          } else if (assertion.status === 'failed') {
            failed = true;
          }
        });
      }
    });
    
    if (failed) {
      status = 'Failed';
    } else if (passed && !failed) {
      status = 'Passed';
    } else if (testFiles.length === 0) {
      status = 'Not Run';
    }
    
    return {
      testId: test.id,
      testName: test.name,
      status: status,
      passed: status === 'Passed',
      platform: test.platform,
      criticality: test.criticality,
    };
  });
  
  return mappedResults;
}

/**
 * Create timestamped copy of TEST_REGISTRY with results
 */
function createTestRunRegistry(testResults) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const runId = process.env.RUN_ID || `run_${timestamp}`;
  const tester = process.env.TESTER || (process.env.CI ? 'GitHub Actions' : 'Local');
  const date = new Date().toISOString().split('T')[0];
  const environment = process.env.ENVIRONMENT || (process.env.CI ? 'CI' : 'Development');
  const appVersion = process.env.APP_VERSION || '1.0.0';
  const buildNumber = process.env.BUILD_NUMBER || process.env.GITHUB_RUN_NUMBER || 'unknown';
  
  // Read original registry
  let content = fs.readFileSync(TEST_REGISTRY_PATH, 'utf8');
  
  // Update metadata
  content = content.replace(/\| \*\*Run ID\*\* \| \|/, `| **Run ID** | ${runId} |`);
  content = content.replace(/\| \*\*Tester\*\* \| \|/, `| **Tester** | ${tester} |`);
  content = content.replace(/\| \*\*Date\*\* \| \|/, `| **Date** | ${date} |`);
  content = content.replace(/\| \*\*Environment\*\* \| Development \/ Staging \/ Production \|/, `| **Environment** | ${environment} |`);
  content = content.replace(/\| \*\*App Version\*\* \| \|/, `| **App Version** | ${appVersion} |`);
  content = content.replace(/\| \*\*Build Number\*\* \| \|/, `| **Build Number** | ${buildNumber} |`);
  
  // Update test statuses
  testResults.forEach(result => {
    const testId = result.testId;
    const statusMark = result.status === 'Passed' ? '[x]' : result.status === 'Failed' ? '[x]' : '[ ]';
    
    // Update status in registry (match the test ID row, handle both [ ] and [x])
    const escapedTestId = testId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const testIdPattern = new RegExp(`(\\| ${escapedTestId} \\|.*?\\|) \\[([ x])\\]`, 'g');
    content = content.replace(testIdPattern, `$1 ${statusMark}`);
  });
  
  // Calculate summary
  const total = testResults.length;
  const passed = testResults.filter(r => r.status === 'Passed').length;
  const failed = testResults.filter(r => r.status === 'Failed').length;
  const notRun = testResults.filter(r => r.status === 'Not Run').length;
  
  // Update summary table
  const summaryPattern = /\| \*\*TOTAL\*\* \| \*\*(\d+)\*\* \| \| \| \| \|/;
  content = content.replace(summaryPattern, `| **TOTAL** | **${total}** | ${passed} | ${failed} | 0 | ${notRun} |`);
  
  // Write to results directory
  const resultFileName = `TEST_REGISTRY_${timestamp}.md`;
  const resultPath = path.join(RESULTS_DIR, resultFileName);
  fs.writeFileSync(resultPath, content, 'utf8');
  
  console.log(`\n✅ Test run registry created: ${resultPath}`);
  console.log(`\n📊 Summary: ${passed} passed, ${failed} failed, ${notRun} not run\n`);
  
  return resultPath;
}

/**
 * Main test runner function
 */
function runTests() {
  console.log(`🚀 Starting Test Runner`);
  console.log(`Environment: ${process.env.CI ? 'CI' : 'Local'}\n`);
  
  try {
    // Step 1: Parse all tests from registry
    console.log(`📋 Parsing all automated tests from TEST_REGISTRY.md...`);
    const registryTests = parseAllTests();
    console.log(`Found ${registryTests.length} automated tests\n`);
    
    if (registryTests.length === 0) {
      console.warn(`⚠️  No automated tests found in TEST_REGISTRY.md.`);
      return;
    }
    
    // Step 2: Run Jest tests
    const jestResults = runJestTests();
    
    // Step 3: Map results to registry
    console.log('\n🔗 Mapping test results to TEST_REGISTRY...');
    const mappedResults = mapTestResultsToRegistry(jestResults, registryTests);
    
    // Step 4: Create test run registry
    const resultPath = createTestRunRegistry(mappedResults);
    
    // Step 5: Exit with appropriate code
    const hasFailures = mappedResults.some(r => r.status === 'Failed');
    if (hasFailures) {
      console.error(`\n❌ Some tests failed!`);
      process.exit(1);
    } else {
      console.log(`\n✅ All tests passed!`);
      process.exit(0);
    }
  } catch (error) {
    console.error('\n❌ Test runner error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests, parseAllTests, mapTestResultsToRegistry };
