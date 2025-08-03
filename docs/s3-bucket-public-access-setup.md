# 🔧 S3 Bucket Public Access Setup

## 🚨 **Problem**

You're getting "Access Denied" when trying to view uploaded files because your S3 bucket is not configured for public read access.

## ✅ **Solution**

Configure your S3 bucket to allow public read access to uploaded files.

## 🔧 **Step-by-Step Setup**

### **1. AWS S3 Console Setup**

#### **Step 1: Update Bucket Public Access Settings**

1. **Go to AWS S3 Console** → Find your bucket (`learnwithpeni`)
2. **Click on your bucket name**
3. **Go to "Permissions" tab**
4. **Find "Block public access (bucket settings)"**
5. **Click "Edit"**
6. **Uncheck these options**:
   - ❌ Block public access to buckets and objects granted through new access control lists (ACLs)
   - ❌ Block public access to buckets and objects granted through any access control lists (ACLs)
   - ❌ Block public access to buckets and objects granted through new public bucket or access point policies
   - ❌ Block public access to buckets and objects granted through any public bucket or access point policies
7. **Click "Save changes"**
8. **Type "confirm" when prompted**

#### **Step 2: Add Bucket Policy**

1. **Still in "Permissions" tab**
2. **Scroll down to "Bucket policy"**
3. **Click "Edit"**
4. **Paste this policy** (replace `learnwithpeni` with your bucket name):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::learnwithpeni/*"
    }
  ]
}
```

5. **Click "Save changes"**

### **2. Test Your Setup**

#### **Upload a Test File**

1. **Go to your course creation page**
2. **Upload a course image or video**
3. **Copy the file URL from the response**
4. **Open the URL in a new browser tab**
5. **Should now show the file instead of "Access Denied"**

#### **Check Existing Files**

- All previously uploaded files should now be accessible
- Try accessing any file URL you got from previous uploads

## 🔒 **Security Considerations**

### **What This Does:**

- ✅ **Allows public read access** to all files in your bucket
- ✅ **Files are accessible via direct S3 URLs**
- ❌ **Anyone with the URL can access the files**

### **This is Safe Because:**

- 🔐 **Upload requires authentication** (only admins can upload)
- 🎯 **File URLs are random and hard to guess** (`1754194596434-rdokaw-filename.mp4`)
- 📚 **LMS content is meant to be accessible** to enrolled students
- 🚫 **No sensitive data** should be in course files

### **For Extra Security (Optional):**

If you want more control, you can:

1. **Use Pre-signed URLs** for temporary access
2. **Implement access control** in your application
3. **Set up CloudFront** with signed URLs (more complex)

## 🧪 **Verify It's Working**

### **Method 1: Direct URL Test**

1. **Upload a file through your admin panel**
2. **Copy the returned URL**
3. **Paste it in a new browser tab**
4. **Should display/download the file**

### **Method 2: Course Page Test**

1. **Create a course with video/document modules**
2. **Visit the course page as a student**
3. **Videos should play and documents should open**

### **Method 3: AWS S3 Console Check**

1. **Go to S3 Console → Your bucket**
2. **Click on any uploaded file**
3. **Click "Object URL" link**
4. **Should open the file, not show Access Denied**

## 📝 **Alternative Bucket Policy (More Restrictive)**

If you want to only allow access to course content specifically:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadCourseContent",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": [
        "arn:aws:s3:::learnwithpeni/course-content/*",
        "arn:aws:s3:::learnwithpeni/courses/*"
      ]
    }
  ]
}
```

This only allows public access to files in the `course-content/` and `courses/` folders.

## 🚨 **Troubleshooting**

### **Still Getting Access Denied?**

1. **Wait 5-10 minutes** for AWS changes to propagate
2. **Clear your browser cache**
3. **Try accessing the URL in an incognito/private window**
4. **Double-check the bucket policy is saved correctly**

### **Policy Not Saving?**

- Make sure you disabled "Block public access" first
- Check that the bucket name in the policy matches exactly
- Ensure the JSON is valid (no syntax errors)

### **Files Still Not Accessible?**

- Try uploading a new file and test its URL
- Check the file was uploaded to the correct bucket
- Verify the file path in the URL matches what's in S3

---

## 🎉 **After Setup**

Once configured, your S3 bucket will:

- ✅ **Allow public read access** to all uploaded course files
- ✅ **Work with direct S3 URLs** (no CDN needed)
- ✅ **Support video streaming** and document downloads
- ✅ **Be accessible from your LMS** for students

**Your file uploads should now be fully functional!** 🚀
