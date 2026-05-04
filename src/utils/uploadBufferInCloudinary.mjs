import cloudinaryConfig from "../config/cloudinary.mjs";

function uploadBufferToCloudinary(buffer, folder = "tickets") {
  return new Promise((resolve, reject) => {
    const stream = cloudinaryConfig.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        type: "upload",
        access_mode: "public",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      },
    );

    stream.end(buffer); //  send buffer here
  });
}

export default uploadBufferToCloudinary;
