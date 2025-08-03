# 🚀 AWS S3 Migration Guide - From Supabase Storage to AWS S3

## 📋 Overview

This guide covers the complete migration from Supabase Storage to AWS S3 for handling course files, videos, images, and documents in your LMS.

## ✅ **What's Been Migrated**

### **File Storage System**

- ✅ **Course Images**: Profile images for courses
- ✅ **Video Content**: Course video modules (up to 1GB each)
- ✅ **Documents**: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT files
- ✅ **Archives**: ZIP, RAR, 7Z files
- ✅ **Organized Storage**: Files organized by course and type

### **Components Updated**

- ✅ `components/FileUpload.tsx` - New S3-powered upload component
- ✅ `app/admin/courses/create/page.tsx` - Course creation with S3 uploads
- ✅ `lib/aws-s3.ts` - Complete S3 helper library
- ✅ `lib/upload-config.ts` - Updated file size limits (1GB for all files)

## 🔧 **Setup Instructions**

### **1. Create AWS S3 Bucket**

1. **Login to AWS Console**
2. **Navigate to S3 Service**
3. **Create New Bucket**:
   ```
   Bucket Name: your-lms-bucket (must be globally unique)
   Region: us-east-1 (or your preferred region)
   Public Access: Allow public read access (for file serving)
   Versioning: Disabled (or enabled if you want file versions)
   Encryption: AES-256 (recommended)
   ```

### **2. Configure IAM User & Permissions**

1. **Create IAM User**:

   ```
   User Name: lms-s3-user
   Access Type: Programmatic access
   ```

2. **Create IAM Policy**:

   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "s3:GetObject",
           "s3:PutObject",
           "s3:DeleteObject",
           "s3:ListBucket"
         ],
         "Resource": [
           "arn:aws:s3:::your-lms-bucket",
           "arn:aws:s3:::your-lms-bucket/*"
         ]
       }
     ]
   }
   ```

3. **Attach Policy to User**

### **3. Environment Variables**

Add to your `.env.local`:

```bash
# AWS S3 Storage
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your-access-key-id"
AWS_SECRET_ACCESS_KEY="your-secret-access-key"
AWS_S3_BUCKET_NAME="your-lms-bucket"
```

### **4. Install Dependencies**

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

## 📁 **File Organization in S3**

### **Bucket Structure**

```
your-lms-bucket/
├── courses/
│   ├── course-123/
│   │   ├── videos/
│   │   │   └── 1234567890-abc123-video.mp4
│   │   ├── documents/
│   │   │   └── 1234567890-def456-document.pdf
│   │   └── images/
│   │       └── 1234567890-ghi789-thumbnail.jpg
│   └── course-456/
│       └── ...
└── course-content/
    ├── videos/
    ├── documents/
    ├── images/
    └── archives/
```

## 🔄 **Migration Process**

### **Automatic Migration (New Files)**

- All new file uploads automatically go to S3
- Existing Supabase URLs remain functional
- No immediate action needed for existing files

### **Manual Migration (Optional)**

If you want to migrate existing files from Supabase to S3:

1. **Export from Supabase**:

   ```bash
   # Download existing files from Supabase Storage
   # This requires custom script - contact support if needed
   ```

2. **Upload to S3**:

   ```bash
   # Use AWS CLI or custom migration script
   aws s3 cp ./local-files/ s3://your-lms-bucket/ --recursive
   ```

3. **Update Database URLs**:
   ```sql
   UPDATE courses SET image = REPLACE(image, 'supabase-url', 's3-url');
   UPDATE modules SET content = REPLACE(content, 'supabase-url', 's3-url');
   ```

## 🧪 **Testing the Integration**

### **1. Test S3 Configuration**

Visit: `http://localhost:3000/api/test-s3`

This will check:

- ✅ Environment variables
- ✅ AWS credentials
- ✅ S3 bucket connectivity
- ✅ File path generation

### **2. Test File Upload**

1. **Create a new course**
2. **Upload course image**
3. **Add video module and upload video**
4. **Add document module and upload file**
5. **Verify files appear in S3 bucket**

### **3. Test File Access**

1. **View uploaded files in browser**
2. **Check file URLs point to S3**
3. **Verify direct S3 URL access**

## 💰 **Cost Considerations**

### **S3 Pricing (US East)**

- **Storage**: ~$0.023 per GB/month
- **Requests**: ~$0.0004 per 1,000 requests
- **Data Transfer**: First 100GB free/month

### **Cost Comparison**

- **Supabase**: $25/month for 100GB + bandwidth
- **AWS S3**: ~$2-5/month for same usage

## 🔒 **Security Features**

### **Built-in Security**

- ✅ **Server-side Encryption**: AES-256 encryption at rest
- ✅ **Access Control**: IAM-based permissions
- ✅ **Secure Upload**: Authenticated API endpoints only
- ✅ **File Validation**: Type and size validation before upload

### **Additional Security (Optional)**

- 🔐 **Bucket Policies**: Restrict access by IP/user agent
- 🔒 **Pre-signed URLs**: Time-limited access to sensitive files

## 🆘 **Troubleshooting**

### **Common Issues**

#### **1. "Access Denied" Errors**

```bash
# Check IAM permissions
aws iam list-attached-user-policies --user-name lms-s3-user

# Test AWS CLI access
aws s3 ls s3://your-lms-bucket
```

#### **2. "Bucket Not Found" Errors**

- Verify bucket name in environment variables
- Check bucket region matches AWS_REGION
- Ensure bucket exists and is accessible

#### **3. Upload Failures**

- Check file size limits
- Verify file type is allowed
- Check network connectivity
- Review browser console for errors

#### **4. Files Not Loading**

- Verify S3 URLs are accessible
- Check bucket public access settings
- Ensure correct bucket permissions

### **Debug Endpoints**

- `/api/test-s3` - Test S3 configuration
- Check browser network tab for upload failures
- Review server logs for detailed error messages

## 📋 **Migration Checklist**

### **Pre-Migration**

- [ ] AWS account setup
- [ ] S3 bucket created
- [ ] IAM user and policy configured
- [ ] Environment variables added
- [ ] Dependencies installed

### **Post-Migration**

- [ ] Test S3 configuration (`/api/test-s3`)
- [ ] Test file uploads (all types)
- [ ] Verify file access in browser
- [ ] Monitor S3 costs
- [ ] Update backup procedures

### **Production Deployment**

- [ ] Update environment variables in production
- [ ] Test file uploads in production
- [ ] Monitor error logs
- [ ] Set up S3 bucket notifications (optional)
- [ ] Configure lifecycle policies (optional)

## 🎉 **Benefits of Migration**

### **Immediate Benefits**

- 💰 **Cost Savings**: Significantly lower storage costs
- ⚡ **Performance**: Reliable file uploads and downloads
- 📈 **Scalability**: Handle unlimited file storage
- 🔧 **Simplicity**: Direct S3 URLs without CDN complexity

### **Long-term Benefits**

- 🔧 **Flexibility**: More storage options and configurations
- 🔒 **Security**: Enterprise-grade AWS security
- 📊 **Analytics**: Detailed usage metrics
- 🤖 **Automation**: Advanced lifecycle management

---

## 🚀 **You're Ready!**

Your LMS now uses AWS S3 for all file storage with:

- ✅ **1GB file upload limit** for videos and documents
- ✅ **Organized file structure** by course and type
- ✅ **Secure uploads** with validation
- ✅ **Direct S3 URLs** for file access
- ✅ **Cost-effective** storage solution
- ✅ **Production-ready** scalability

**Next steps**: Configure your AWS credentials and test the integration! 🎯
