export const getCurrentYear = () => new Date().getFullYear();

export const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString();
}; 