// AI Search Test - Add this to browser console to test AI functionality
console.log('🧪 Testing AI Search Engine...');

// Test the search with various queries
const testQueries = [
  'BMW',
  'Toyota',  
  '2023 Toyota',
  'BMW near me',
  'Toyota in California',
  '(212) 555-0001'
];

// Import the search function (this won't work directly in console, but shows the concept)
testQueries.forEach(query => {
  console.log(`\n🔍 Testing query: "${query}"`);
  // The search function would be called here
  // Results would show up in console
});

// To test in browser console, type in the search input instead
console.log('💡 To test: Type in the search box and watch the console for AI logs');
console.log('📝 Try these test queries:');
testQueries.forEach(q => console.log(`   - ${q}`));