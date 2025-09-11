const { S3Client, PutBucketCorsCommand, GetBucketCorsCommand } = require("@aws-sdk/client-s3");

// Read .env file manually
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envFiles = ['.env', '.env.local']; // Check .env first, then .env.local
  
  for (const envFile of envFiles) {
    try {
      const envPath = path.join(__dirname, '..', envFile);
      if (fs.existsSync(envPath)) {
        console.log(`📁 Loading environment from ${envFile}`);
        const envContent = fs.readFileSync(envPath, 'utf-8');
        const envVars = {};
        envContent.split('\n').forEach(line => {
          line = line.trim();
          if (line && !line.startsWith('#') && line.includes('=')) {
            const [key, ...valueParts] = line.split('=');
            envVars[key.trim()] = valueParts.join('=').trim().replace(/["']/g, '');
          }
        });
        return envVars;
      }
    } catch (error) {
      console.log(`Could not load ${envFile}, trying next...`);
    }
  }
  
  console.log('No .env files found, using system environment variables');
  return {};
}

const envVars = loadEnv();
const getEnvVar = (key) => envVars[key] || process.env[key];

// Initialize S3 Client
const s3Client = new S3Client({
  region: getEnvVar('AWS_REGION') || "us-east-1",
  credentials: {
    accessKeyId: getEnvVar('AWS_ACCESS_KEY_ID'),
    secretAccessKey: getEnvVar('AWS_SECRET_ACCESS_KEY'),
  },
});

const bucketName = getEnvVar('AWS_S3_BUCKET_NAME');
const accessKeyId = getEnvVar('AWS_ACCESS_KEY_ID');
const secretAccessKey = getEnvVar('AWS_SECRET_ACCESS_KEY');
const region = getEnvVar('AWS_REGION') || "us-east-1";

if (!bucketName || !accessKeyId || !secretAccessKey) {
  console.error("❌ Missing required AWS S3 environment variables!");
  console.log("\n📝 Required environment variables:");
  console.log(`   AWS_S3_BUCKET_NAME: ${bucketName ? '✅ Set' : '❌ Missing'}`);
  console.log(`   AWS_ACCESS_KEY_ID: ${accessKeyId ? '✅ Set' : '❌ Missing'}`);
  console.log(`   AWS_SECRET_ACCESS_KEY: ${secretAccessKey ? '✅ Set' : '❌ Missing'}`);
  console.log(`   AWS_REGION: ${region} (${getEnvVar('AWS_REGION') ? '✅ Set' : 'ℹ️  Using default'})`);
  
  console.log("\n💡 To fix this:");
  console.log("   1. Create a .env.local file in the project root");
  console.log("   2. Add your AWS S3 configuration:");
  console.log("      AWS_S3_BUCKET_NAME=your-bucket-name");
  console.log("      AWS_ACCESS_KEY_ID=your-access-key");
  console.log("      AWS_SECRET_ACCESS_KEY=your-secret-key");
  console.log("      AWS_REGION=us-east-1");
  console.log("   3. Run this script again");
  
  console.log("\n🌐 Or use AWS CLI to configure CORS manually:");
  console.log('   aws s3api put-bucket-cors --bucket your-bucket-name --cors-configuration file://cors.json');
  
  process.exit(1);
}

// CORS configuration for video streaming
const corsConfiguration = {
  CORSRules: [
    {
      ID: "AllowVideoStreaming",
      AllowedHeaders: [
        "*"
      ],
      AllowedMethods: [
        "GET",
        "HEAD"
      ],
      AllowedOrigins: [
        "http://localhost:3000",
        "https://localhost:3000",
        "https://*.vercel.app",
        "https://*.netlify.app",
        "*" // Allow all origins for public video streaming
      ],
      ExposeHeaders: [
        "Content-Range",
        "Content-Length",
        "Accept-Ranges",
        "Content-Type"
      ],
      MaxAgeSeconds: 3600
    },
    {
      ID: "AllowVideoRangeRequests",
      AllowedHeaders: [
        "Range",
        "If-Range"
      ],
      AllowedMethods: [
        "GET",
        "HEAD"
      ],
      AllowedOrigins: ["*"],
      ExposeHeaders: [
        "Content-Range",
        "Accept-Ranges",
        "Content-Length"
      ],
      MaxAgeSeconds: 86400
    }
  ]
};

async function setupCors() {
  try {
    console.log(`🔧 Setting up CORS configuration for bucket: ${bucketName}`);
    
    // Check existing CORS configuration
    try {
      const getCorsCommand = new GetBucketCorsCommand({ Bucket: bucketName });
      const existingCors = await s3Client.send(getCorsCommand);
      console.log("📋 Existing CORS configuration:", JSON.stringify(existingCors.CORSRules, null, 2));
    } catch (error) {
      if (error.name === 'NoSuchCORSConfiguration') {
        console.log("ℹ️  No existing CORS configuration found");
      } else {
        console.log("⚠️  Could not retrieve existing CORS configuration:", error.message);
      }
    }

    // Set new CORS configuration
    const putCorsCommand = new PutBucketCorsCommand({
      Bucket: bucketName,
      CORSConfiguration: corsConfiguration,
    });

    await s3Client.send(putCorsCommand);
    console.log("✅ CORS configuration updated successfully!");
    
    // Verify the configuration
    const verifyCorsCommand = new GetBucketCorsCommand({ Bucket: bucketName });
    const verifyResult = await s3Client.send(verifyCorsCommand);
    
    console.log("🔍 New CORS configuration:");
    console.log(JSON.stringify(verifyResult.CORSRules, null, 2));
    
    console.log("\n🎯 Key benefits of this CORS configuration:");
    console.log("   • Allows video streaming from any origin (better for low-bandwidth users)");
    console.log("   • Supports HTTP Range requests for video seeking");
    console.log("   • Exposes necessary headers for video playback");
    console.log("   • Reduces server load by enabling direct S3 access");
    
  } catch (error) {
    console.error("❌ Error setting up CORS:", error.message);
    
    if (error.name === 'AccessDenied') {
      console.error("💡 Make sure your AWS credentials have s3:PutBucketCors and s3:GetBucketCors permissions");
    }
    
    process.exit(1);
  }
}

// Run the setup
setupCors();
