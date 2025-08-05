# S3 Direct Upload Implementation Guide

## Overview

This document explains the implementation of direct S3 uploads to solve the payload size limitation issue when deploying to Vercel. The solution uses presigned URLs to allow the client to upload files directly to S3, bypassing the Vercel API route size limitations.

## Problem

When deploying to Vercel, there's a 4.5MB payload size limit for API routes. This makes it impossible to upload large files (like videos) through the standard API route approach where the file is first sent to the server and then to S3.

## Solution

The solution implements a three-step process:

1. **Request a presigned URL**: The client sends file metadata to the server
2. **Direct upload**: The client uploads the file directly to S3 using the presigned URL
3. **Confirmation**: The client confirms the upload with the server

## Implementation Details

### Backend (API Route)

The `/api/upload/s3` route now has two methods:

- **POST**: Generates a presigned URL for direct upload
- **PUT**: Confirms a successful upload

### Frontend (FileUpload Component)

The `FileUpload` component has been updated to:

1. Request a presigned URL from the server
2. Upload the file directly to S3 using XMLHttpRequest with progress tracking
3. Confirm the upload with the server

## Benefits

- Bypasses Vercel's 4.5MB payload size limit
- Improves upload performance by sending files directly to S3
- Provides accurate upload progress tracking
- Reduces server load as files don't pass through the server

## Technical Flow

```
Client                          Server                          S3
  |                               |                              |
  |-- 1. Request presigned URL -->|                              |
  |                               |-- Generate presigned URL --->|
  |<-- Return presigned URL ------|<-- Return presigned URL -----|
  |                               |                              |
  |-- 2. Upload file directly ---------------------------->      |
  |<-- Upload confirmation --------------------------------      |
  |                               |                              |
  |-- 3. Confirm upload -------->|                              |
  |<-- Confirmation response ----|                              |
```

## Limitations and Considerations

- The client needs JavaScript enabled to perform the direct upload
- CORS must be properly configured on the S3 bucket
- The presigned URL has an expiration time (default: 1 hour)

## Troubleshooting

### CORS Issues

If you encounter CORS errors during upload, ensure your S3 bucket has the following CORS configuration:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT", "POST", "GET"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"]
  }
]
```

### Upload Failures

If uploads are failing:

1. Check browser console for errors
2. Verify AWS credentials are correct
3. Ensure the S3 bucket has proper write permissions
4. Check that the file type is allowed by your application

## Future Improvements

- Add support for multipart uploads for very large files
- Implement retry logic for failed uploads
- Add server-side validation of completed uploads