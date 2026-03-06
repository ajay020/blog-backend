// Extract Cloudinary public ID
const extractPublicId = (url) => {
    if (!url) return null;
    try {
        const matches = url.match(/\/v\d+\/(.+)\.[a-z]+$/);
        return matches ? matches[1] : null;
    } catch {
        return null;
    }
};

module.exports = {
    extractPublicId
}