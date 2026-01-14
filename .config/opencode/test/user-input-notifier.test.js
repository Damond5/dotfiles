/**
 * Integration test for user-input-notifier plugin
 * Tests the question.asked event handler functionality
 */

// Mock $ for testing
const mock$ = async (cmd) => {
  // Simulate successful notification
  return { success: true, command: cmd };
};

// Simulate the plugin's event handler
const createEventHandler = () => {
  const notifyAvailable = true;
  
  return {
    event: async ({ event }) => {
      if (!notifyAvailable) return;

      // Handle question.asked event
      if (event.type === "question.asked") {
        const { id, sessionID, questions, tool } = event.properties || {};
        if (!questions || !Array.isArray(questions) || questions.length === 0) return;
        
        // Build notification message based on available fields
        let message = 'A question was asked';
        
        // Add header if available
        if (questions.length > 0 && questions[0].header) {
          message += `:\n${questions[0].header}`;
        }
        
        // Add question text(s)
        if (questions.length > 0 && questions[0].question) {
          // Check if all questions have question properties (multiple single questions)
          const allHaveQuestions = questions.every(q => q.question);
          if (allHaveQuestions && questions.length > 1) {
            // Show all questions as a list
            message += `\n\nQuestions:\n${questions.map(q => q.question).join('\n')}`;
          } else {
            // Show the first question
            message += `\n\nQuestion: ${questions[0].question}`;
          }
        } else if (questions.length > 0) {
          // If no direct question property, join all question texts
          const questionTexts = questions.map(q => q.question).filter(Boolean);
          if (questionTexts.length > 0) {
            message += `\n\nQuestions:\n${questionTexts.join('\n')}`;
          }
        }
        
        // Add options information if available
        if (questions.length > 0 && questions[0].options && Array.isArray(questions[0].options) && questions[0].options.length > 0) {
          message += `\n\nAvailable options:\n${questions[0].options.map((opt, idx) => `${idx + 1}. ${opt}`).join('\n')}`;
        }
        
        // Add tool context if available
        if (tool) {
          message += `\n\nContext: ${tool}`;
        }
        
        try {
          await mock$`notify-send "OpenCode" "${message}" --urgency=normal`;
          return { success: true, message };
        } catch (error) {
          return { success: false, error: error.message };
        }
      }
      return null;
    }
  };
};

// Test runner
async function runTests() {
  console.log('Running user-input-notifier integration tests...\n');
  
  const handler = createEventHandler();
  let passed = 0;
  let failed = 0;

  // Test 1: Full question with all fields
  console.log('Test 1: Full question with all fields');
  const result1 = await handler.event({
    event: {
      type: "question.asked",
      properties: {
        id: "123",
        sessionID: "session-456",
        tool: "file-editor",
        questions: [{
          header: "File Operations",
          question: "Would you like me to create a new file?",
          options: ["Yes, create it", "No, skip it", "Show me options"]
        }]
      }
    }
  });
  
  if (result1 && result1.success && result1.message.includes('File Operations') && 
      result1.message.includes('Would you like me to create a new file?') &&
      result1.message.includes('Available options')) {
    console.log('✓ PASS: Full question handled correctly\n');
    passed++;
  } else {
    console.log('✗ FAIL: Full question test failed\n');
    failed++;
  }

  // Test 2: Question with header but no options
  console.log('Test 2: Question with header but no options');
  const result2 = await handler.event({
    event: {
      type: "question.asked",
      properties: {
        questions: [{
          header: "Simple Question",
          question: "Do you want to continue?"
        }]
      }
    }
  });
  
  if (result2 && result2.success && result2.message.includes('Simple Question')) {
    console.log('✓ PASS: Question without options handled correctly\n');
    passed++;
  } else {
    console.log('✗ FAIL: Question without options test failed\n');
    failed++;
  }

  // Test 3: Multiple questions
  console.log('Test 3: Multiple questions');
  const result3 = await handler.event({
    event: {
      type: "question.asked",
      properties: {
        questions: [
          { question: "First question?" },
          { question: "Second question?" }
        ]
      }
    }
  });
  
  if (result3 && result3.success && 
      result3.message.includes('First question?') && 
      result3.message.includes('Second question?')) {
    console.log('✓ PASS: Multiple questions handled correctly\n');
    passed++;
  } else {
    console.log('✗ FAIL: Multiple questions test failed\n');
    failed++;
  }

  // Test 4: Empty questions array (should be ignored)
  console.log('Test 4: Empty questions array (should be ignored)');
  const result4 = await handler.event({
    event: {
      type: "question.asked",
      properties: {
        questions: []
      }
    }
  });
  
  if (!result4) {
    console.log('✓ PASS: Empty questions array ignored correctly\n');
    passed++;
  } else {
    console.log('✗ FAIL: Empty questions array test failed\n');
    failed++;
  }

  // Test 5: Invalid event type (should be ignored)
  console.log('Test 5: Invalid event type (should be ignored)');
  const result5 = await handler.event({
    event: {
      type: "permission.asked",
      properties: {
        permission: "test"
      }
    }
  });
  
  if (!result5) {
    console.log('✓ PASS: Invalid event type ignored correctly\n');
    passed++;
  } else {
    console.log('✗ FAIL: Invalid event type test failed\n');
    failed++;
  }

  // Test 6: Question with tool context only
  console.log('Test 6: Question with tool context only');
  const result6 = await handler.event({
    event: {
      type: "question.asked",
      properties: {
        tool: "code-analyzer",
        questions: [{
          question: "Analysis complete. What would you like to do?"
        }]
      }
    }
  });
  
  if (result6 && result6.success && result6.message.includes('Context: code-analyzer')) {
    console.log('✓ PASS: Tool context handled correctly\n');
    passed++;
  } else {
    console.log('✗ FAIL: Tool context test failed\n');
    failed++;
  }

  console.log(`Test Results: ${passed} passed, ${failed} failed`);
  return failed === 0;
}

// Run tests
runTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Test runner failed:', error);
  process.exit(1);
});