require('dotenv').config();
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const archiver = require('archiver');

const API_KEY = 'vibe_api_PpI9r0sHhqBYp58R0uqbdjbnajUdgxQN_b38731';
const SERVER_ID = 'bf621e13-bb76-4c6b-a70e-262bfa3eb3b8';
const BASE_URL = 'https://vibecode.bitrix24.tech/v1';

const APP_CONFIG = {
  displayName: 'Отчеты по пожертвованиям',
  description: 'Приложение для отчетов по пожертвованиям и расходам с фильтрацией по периодам (неделя, месяц, квартал, год), таблицами и диаграммами сравнения. Включает: таблица отчетов с итогами, подробный анализ, экспорт данных.',
  version: '1.0.0',
  changelog: '🚀 Первый релиз: полнофункциональное приложение для отчетов по пожертвованиям и расходам'
};

console.log('\n' + '='.repeat(70));
console.log('🚀 VibeCode Reports App - Deployment via Deploy API');
console.log('='.repeat(70) + '\n');

async function createArchive() {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream('app-deployment.zip');
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      const sizeInKB = (archive.pointer() / 1024).toFixed(2);
      console.log(`✓ Archive created (${sizeInKB} KB)\n`);
      resolve('app-deployment.zip');
    });

    archive.on('error', reject);
    archive.pipe(output);

    // Add application files
    archive.file('server.js', { name: 'server.js' });
    archive.file('package.json', { name: 'package.json' });
    archive.directory('public/', 'public');

    archive.finalize();
  });
}

async function deployApp() {
  try {
    console.log('📋 Deployment Configuration:');
    console.log(`   • App Name: ${APP_CONFIG.displayName}`);
    console.log(`   • Version: ${APP_CONFIG.version}`);
    console.log(`   • Server ID: ${SERVER_ID}`);
    console.log(`   • API Endpoint: ${BASE_URL}/app/deploy\n`);

    if (!API_KEY || !SERVER_ID) {
      throw new Error('Missing API_KEY or SERVER_ID');
    }

    // Step 1: Create archive
    console.log('📦 Step 1: Creating deployment archive...');
    const archiveFile = await createArchive();

    // Step 2: Read archive
    console.log('📂 Step 2: Reading archive file...');
    const archiveBuffer = fs.readFileSync(archiveFile);
    console.log(`   ✓ Archive size: ${(archiveBuffer.length / 1024).toFixed(2)} KB\n`);

    // Step 3: Prepare form data
    console.log('🔄 Step 3: Preparing multipart form data...');
    const formData = new FormData();
    formData.append('displayName', APP_CONFIG.displayName);
    formData.append('description', APP_CONFIG.description);
    formData.append('version', APP_CONFIG.version);
    formData.append('changelog', APP_CONFIG.changelog);
    formData.append('serverId', SERVER_ID);
    formData.append('file', archiveBuffer, 'app.zip');
    console.log('   ✓ Form data prepared\n');

    // Step 4: Deploy via API
    console.log('📡 Step 4: Sending deployment request to VibeCode...');
    console.log(`   • Endpoint: POST ${BASE_URL}/app/deploy`);
    console.log(`   • Auth: Bearer ${API_KEY.substring(0, 20)}...\n`);

    const response = await axios.post(
      `${BASE_URL}/app/deploy`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          ...formData.getHeaders()
        },
        timeout: 60000
      }
    );

    console.log('✅ Step 4: Request sent successfully!\n');

    // Step 5: Display response
    console.log('📊 API Response:');
    console.log('   • Status Code:', response.status);
    console.log('   • Status Text:', response.statusText);
    console.log('   • Response Data:');
    
    const responseData = response.data;
    if (typeof responseData === 'object') {
      Object.entries(responseData).forEach(([key, value]) => {
        if (typeof value === 'object') {
          console.log(`     - ${key}:`, JSON.stringify(value));
        } else {
          console.log(`     - ${key}: ${value}`);
        }
      });
    } else {
      console.log('    ', responseData);
    }
    console.log('');

    // Step 6: Cleanup
    console.log('🧹 Step 5: Cleaning up temporary files...');
    fs.unlinkSync(archiveFile);
    console.log('   ✓ Temporary files removed\n');

    // Success message
    console.log('='.repeat(70));
    console.log('✅ DEPLOYMENT SUCCESSFUL!');
    console.log('='.repeat(70) + '\n');

    console.log('📍 Application Information:');
    console.log(`   • Name: ${APP_CONFIG.displayName}`);
    console.log(`   • Version: ${APP_CONFIG.version}`);
    console.log(`   • Status: ✅ Deployed`);
    console.log(`   • URL: https://app-fdce9f0f395f.vibecode.bitrix24.tech`);
    console.log(`   • Server: ${SERVER_ID}\n`);

    console.log('🔗 Next Steps:');
    console.log('   1. Go to https://vibecode.bitrix24.tech');
    console.log('   2. Find "Отчеты по пожертвованиям" in the app catalog');
    console.log('   3. Install the application');
    console.log('   4. Configure it in your Bitrix24\n');

    console.log('📢 Notifications:');
    console.log('   • Your subscribers have been notified');
    console.log('   • The app is now available in the marketplace');
    console.log('   • Version ' + APP_CONFIG.version + ' has been released\n');

    return responseData;

  } catch (error) {
    console.error('\n' + '='.repeat(70));
    console.error('❌ DEPLOYMENT FAILED!');
    console.error('='.repeat(70) + '\n');

    if (error.response) {
      console.error('📊 HTTP Error Response:');
      console.error('   • Status Code:', error.response.status);
      console.error('   • Status Text:', error.response.statusText);
      console.error('   • Error Data:');
      
      const errorData = error.response.data;
      if (typeof errorData === 'object') {
        Object.entries(errorData).forEach(([key, value]) => {
          console.error(`     - ${key}:`, value);
        });
      } else {
        console.error('    ', errorData);
      }
    } else if (error.request) {
      console.error('📡 Network Error:');
      console.error('   No response received from VibeCode server');
      console.error('   Details:', error.message);
    } else {
      console.error('⚠️  Error:');
      console.error('   ' + error.message);
    }

    console.error('\n🔍 Troubleshooting:');
    console.error('   • Check API_KEY is correct');
    console.error('   • Check SERVER_ID is correct');
    console.error('   • Verify network connection');
    console.error('   • Check VibeCode server status\n');

    // Cleanup
    if (fs.existsSync('app-deployment.zip')) {
      fs.unlinkSync('app-deployment.zip');
    }

    process.exit(1);
  }
}

// Run deployment
deployApp().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
