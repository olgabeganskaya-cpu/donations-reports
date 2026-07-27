require('dotenv').config();
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const API_KEY = process.env.VIBECODE_API_KEY;
const SERVER_ID = process.env.VIBECODE_SERVER_ID;
const BASE_URL = process.env.VIBECODE_BASE_URL || 'https://vibecode.bitrix24.tech/v1';

// App metadata
const APP_CONFIG = {
  displayName: 'Отчеты по пожертвованиям',
  description: 'Приложение для отчетов по пожертвованиям и расходам с фильтрацией по периодам (неделя, месяц, квартал, год), таблицами и диаграммами сравнения',
  version: '1.0.0',
  changelog: 'Первый релиз: таблица отчетов, диаграммы, фильтрация по периодам, экспорт данных'
};

console.log('🚀 VibeCode Reports App - Deploy via Deploy API\n');

// Create app archive
async function createArchive() {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream('app-deployment.zip');
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      console.log(`✓ Archive created (${archive.pointer()} bytes)`);
      resolve('app-deployment.zip');
    });

    archive.on('error', reject);
    archive.pipe(output);

    // Add files
    archive.file('server.js', { name: 'server.js' });
    archive.file('package.json', { name: 'package.json' });
    archive.directory('public/', 'public');

    archive.finalize();
  });
}

// Deploy to VibeCode
async function deployApp() {
  try {
    console.log('📋 Configuration:');
    console.log(`   API Key: ${API_KEY ? API_KEY.substring(0, 20) + '...' : 'NOT SET'}`);
    console.log(`   Server ID: ${SERVER_ID}`);
    console.log(`   App Name: ${APP_CONFIG.displayName}`);
    console.log(`   Version: ${APP_CONFIG.version}\n`);

    if (!API_KEY || !SERVER_ID) {
      throw new Error('API_KEY and SERVER_ID are required in .env');
    }

    // Step 1: Create archive
    console.log('📦 Creating deployment archive...');
    const archiveFile = await createArchive();

    // Step 2: Read archive
    console.log('📂 Reading archive file...');
    const archiveBuffer = fs.readFileSync(archiveFile);

    // Step 3: Prepare form data
    console.log('🔄 Preparing deployment request...\n');
    
    const formData = new FormData();
    formData.append('displayName', APP_CONFIG.displayName);
    formData.append('description', APP_CONFIG.description);
    formData.append('version', APP_CONFIG.version);
    formData.append('changelog', APP_CONFIG.changelog);
    formData.append('serverId', SERVER_ID);
    formData.append('file', archiveBuffer, 'app.zip');

    // Step 4: Deploy via API
    console.log('📡 Sending deployment request to VibeCode...\n');

    const response = await axios.post(
      `${BASE_URL}/app/deploy`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          ...formData.getHeaders()
        }
      }
    );

    console.log('📊 Response Status:', response.status);
    console.log('📄 Response Data:');
    console.log(JSON.stringify(response.data, null, 2));

    // Step 5: Cleanup
    console.log('\n🧹 Cleaning up...');
    fs.unlinkSync(archiveFile);
    console.log('✓ Temporary files removed');

    console.log('\n✅ Deployment successful!\n');
    console.log('📍 Application Information:');
    console.log(`   Name: ${APP_CONFIG.displayName}`);
    console.log(`   Version: ${APP_CONFIG.version}`);
    console.log(`   URL: https://app-fdce9f0f395f.vibecode.bitrix24.tech\n`);

    return response.data;

  } catch (error) {
    console.error('\n❌ Deployment failed!');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.message);
    } else {
      console.error('Error:', error.message);
    }
    
    // Cleanup
    if (fs.existsSync('app-deployment.zip')) {
      fs.unlinkSync('app-deployment.zip');
    }
    
    process.exit(1);
  }
}

// Run deployment
deployApp();
