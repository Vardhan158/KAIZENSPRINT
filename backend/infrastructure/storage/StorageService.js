class StorageService {
  static async uploadAttachment(fileUrl) {
    return {
      url: fileUrl,
      uploadedAt: new Date().toISOString(),
      status: 'Stored'
    };
  }
}

module.exports = StorageService;
