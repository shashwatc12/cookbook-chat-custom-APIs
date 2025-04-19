// Simple script to test Gemini API key
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Get API key from command line argument
const apiKey = process.argv[2];

if (!apiKey) {
  console.error('Please provide your Gemini API key as a command line argument');
  console.error('Usage: node test-gemini.js YOUR_API_KEY');
  process.exit(1);
}

async function testGeminiAPI() {
  try {
    console.log('Testing Gemini API connection...');

    // Initialize the API
    const genAI = new GoogleGenerativeAI(apiKey);

    // Test chat model
    console.log('Testing chat model (gemini-2.0-flash-thinking-exp-01-21)...');
    const chatModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-thinking-exp-01-21' });
    const chatResult = await chatModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: 'Hello, are you working?' }] }],
    });
    console.log('Chat response:', chatResult.response.text());

    // Test embedding model
    console.log('\nTesting embedding model (embedding-001)...');
    const embeddingModel = genAI.getGenerativeModel({ model: 'embedding-001' });
    const embeddingResult = await embeddingModel.embedContent({
      content: { role: 'user', parts: [{ text: 'Test embedding' }] },
      taskType: 'RETRIEVAL_DOCUMENT',
    });

    const embedding = embeddingResult.embedding.values;
    console.log(`Successfully generated embedding with ${embedding.length} dimensions`);
    console.log('First 5 values:', embedding.slice(0, 5));

    console.log('\n✅ Gemini API is working correctly!');
  } catch (error) {
    console.error('\n❌ Error testing Gemini API:');
    console.error(error.message);
    if (error.errorDetails) {
      console.error('Error details:', JSON.stringify(error.errorDetails, null, 2));
    }
    process.exit(1);
  }
}

testGeminiAPI();
