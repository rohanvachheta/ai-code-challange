#!/usr/bin/env ts-node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { DataGenerator, ServiceUrls } from './DataGenerator';

interface GenerateArgs {
  offers: number;
  purchaseRatio: number;
  transportRatio: number;
  batchSize: number;
  offerService: string;
  purchaseService: string;
  transportService: string;
  searchService: string;
}

async function main() {
  const argv = await yargs(hideBin(process.argv))
    .command(
      'generate',
      'Generate realistic automotive marketplace data',
      (yargs) => {
        return yargs
          .option('offers', {
            alias: 'o',
            type: 'number',
            default: 1000,
            description: 'Number of offers to generate',
          })
          .option('purchase-ratio', {
            alias: 'p',
            type: 'number',
            default: 0.3,
            description: 'Ratio of offers that should have purchases (0.0-1.0)',
          })
          .option('transport-ratio', {
            alias: 't',
            type: 'number',
            default: 0.8,
            description: 'Ratio of purchases that should have transports (0.0-1.0)',
          })
          .option('batch-size', {
            alias: 'b',
            type: 'number',
            default: 50,
            description: 'Number of items to create in each batch',
          })
          .option('offer-service', {
            type: 'string',
            default: 'http://localhost:3001',
            description: 'Offer service URL',
          })
          .option('purchase-service', {
            type: 'string',
            default: 'http://localhost:3002',
            description: 'Purchase service URL',
          })
          .option('transport-service', {
            type: 'string',
            default: 'http://localhost:3003',
            description: 'Transport service URL',
          })
          .option('search-service', {
            type: 'string',
            default: 'http://localhost:3000',
            description: 'Search service URL',
          });
      }
    )
    .demandCommand(1, 'You must specify a command')
    .help()
    .argv;

  if (argv._.includes('generate')) {
    const args = argv as unknown as GenerateArgs;
    
    // Validate arguments
    if (args.offers <= 0) {
      console.error('❌ Number of offers must be positive');
      process.exit(1);
    }
    
    if (args.purchaseRatio < 0 || args.purchaseRatio > 1) {
      console.error('❌ Purchase ratio must be between 0.0 and 1.0');
      process.exit(1);
    }
    
    if (args.transportRatio < 0 || args.transportRatio > 1) {
      console.error('❌ Transport ratio must be between 0.0 and 1.0');
      process.exit(1);
    }

    const urls: ServiceUrls = {
      offerService: args.offerService,
      purchaseService: args.purchaseService,
      transportService: args.transportService,
      searchService: args.searchService,
    };

    console.log('🏗️  Automotive Marketplace Data Generator');
    console.log('=========================================\n');

    const generator = new DataGenerator(urls);
    
    try {
      // Test connectivity to all services
      console.log('🔗 Testing service connectivity...');
      await Promise.all([
        fetch(`${urls.offerService}/offers/statistics`).then(() => console.log('✅ Offer Service: Connected')),
        fetch(`${urls.purchaseService}/purchases/statistics`).then(() => console.log('✅ Purchase Service: Connected')),
        fetch(`${urls.transportService}/transports/statistics`).then(() => console.log('✅ Transport Service: Connected')),
        fetch(`${urls.searchService}/search/statistics`).then(() => console.log('✅ Search Service: Connected')),
      ]);
      
      console.log('');
      
      const startTime = Date.now();
      
      await generator.generateDataset({
        offers: args.offers,
        purchaseRatio: args.purchaseRatio,
        transportRatio: args.transportRatio,
        batchSize: args.batchSize,
      });
      
      const duration = (Date.now() - startTime) / 1000;
      console.log(`\n⏱️  Total time: ${duration.toFixed(2)} seconds`);
      
      // Wait for search indexing
      const expectedDocs = args.offers + 
        Math.round(args.offers * args.purchaseRatio) + 
        Math.round(args.offers * args.purchaseRatio * args.transportRatio);
      
      await generator.waitForSearchIndex(expectedDocs);
      
      console.log('\n🎯 Data generation completed successfully!');
      console.log('💡 You can now test the search functionality in the UI or via API calls.');
      
    } catch (error) {
      console.error('\n❌ Data generation failed:', error);
      process.exit(1);
    }
  }
}

// Example usage commands
console.log(`
🚀 Example Usage:
  
  # Generate a small dataset for testing
  npm run generate -- generate --offers 100
  
  # Generate a medium dataset
  npm run generate -- generate --offers 5000 --purchase-ratio 0.4 --transport-ratio 0.7
  
  # Generate a large dataset for load testing
  npm run generate -- generate --offers 50000 --batch-size 100
  
  # Use custom service URLs
  npm run generate -- generate --offers 1000 \\
    --offer-service http://offer-service:3001 \\
    --purchase-service http://purchase-service:3002 \\
    --transport-service http://transport-service:3003 \\
    --search-service http://search-service:3000
`);

if (require.main === module) {
  main().catch(console.error);
}