import db from "../models/index.js";
const Category = db.Category;

// Get all categories
const getAllCategories = async (req, res) => {
    try {
        const categories = await Category.findAll();
        res.status(200).json(categories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get single category by ID
const getCategoryById = async (req, res) => {
    try {
        const category = await Category.findByPk(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.status(200).json(category);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create new category
const createCategory = async (req, res) => {
    try {
        const newCategory = await Category.create({
            CategoryName: req.body.CategoryName
        });
        res.status(201).json(newCategory);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Update category
const updateCategory = async (req, res) => {
    try {
        const [updated] = await Category.update(
            { CategoryName: req.body.CategoryName },
            {
                where: { categoryId: req.params.id }
            }
        );
        if (updated) {
            const updatedCategory = await Category.findByPk(req.params.id);
            return res.status(200).json(updatedCategory);
        }
        return res.status(404).json({ message: 'Category not found' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete category
const deleteCategory = async (req, res) => {
    try {
        const deleted = await Category.destroy({
            where: { categoryId: req.params.id }
        });
        if (deleted) {
            return res.status(200).json({ message: 'Category deleted successfully' });
        }
        return res.status(404).json({ message: 'Category not found' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
};
