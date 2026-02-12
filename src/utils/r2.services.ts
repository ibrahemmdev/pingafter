import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

@Injectable()
export class R2Service {
  private readonly s3Client: S3Client;
  private readonly bucketName = process.env.R2_BUCKET_NAME;

  constructor() {
    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID!}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });
  }

  async uploadFile(file: Express.Multer.File) {
    try {
      const key = `${Date.now()}-${file.originalname}`;

      const upload = new Upload({
        client: this.s3Client,
        params: {
          Bucket: this.bucketName,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        },
      });

      await upload.done();
      
      return {
        url: `${process.env.FRONTEND_URL}/${key}`, 
        key: key
      };

    } catch (error) {
      console.error('R2 Upload Error:', error);
      throw new InternalServerErrorException('Internal server error.');
    }
  }
  async deleteFile(url: string) {
  try {
    const r2Endpoint = `${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
    if (!url.includes(r2Endpoint) && !url.includes(process.env.FRONTEND_URL!)) {
      return; 
    }
    const key = url.split('/').pop();

    if (!key) return;

    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    await this.s3Client.send(command);
  } catch (error) {
    console.error('Failed to delete old image from R2:', error);
  }
}
}