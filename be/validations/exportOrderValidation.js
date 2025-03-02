import Joi from 'joi';

/**
 * Schema validation cho Export Order
 * Định nghĩa cấu trúc dữ liệu và các ràng buộc cho các thao tác CRUD
 */
const exportOrderSchema = {
    // Schema cho việc tạo mới export order
    createExportOrder: {
        body: Joi.object({
            // ID của khách hàng, bắt buộc phải có
            customerId: Joi.number().required(),
            // Ngày đặt hàng, định dạng ISO, không bắt buộc
            orderDate: Joi.date().iso(),
            // Ghi chú cho đơn hàng, có thể để trống hoặc null
            note: Joi.string().allow('', null),
            // Danh sách các sản phẩm trong đơn hàng
            items: Joi.array().items(
                Joi.object({
                    // ID của sách, bắt buộc
                    bookId: Joi.number().required(),
                    // Số lượng, phải là số nguyên và lớn hơn 0
                    quantity: Joi.number().integer().min(1).required(),
                    // Giá bán, phải lớn hơn hoặc bằng 0
                    price: Joi.number().min(0).required()
                })
            ).required().min(1) // Phải có ít nhất 1 sản phẩm
        })
    },

    // Schema cho việc cập nhật export order
    updateExportOrder: {
        // Validate params trong URL
        params: Joi.object({
            id: Joi.number().required()
        }),
        // Validate body của request
        body: Joi.object({
            customerId: Joi.number(),
            orderDate: Joi.date().iso(),
            note: Joi.string().allow('', null),
            // Trạng thái đơn hàng chỉ được phép là một trong các giá trị định sẵn
            status: Joi.string().valid('pending', 'processing', 'completed', 'cancelled'),
            items: Joi.array().items(
                Joi.object({
                    bookId: Joi.number().required(),
                    quantity: Joi.number().integer().min(1).required(),
                    price: Joi.number().min(0).required()
                })
            )
        })
    }
};

/**
 * Middleware function để validate request
 * @param {string} schema - Tên của schema cần validate (createExportOrder hoặc updateExportOrder)
 * @returns {Function} Express middleware function
 */
export const validateExportOrder = (schema) => (req, res, next) => {
    const validSchema = exportOrderSchema[schema];
    if (validSchema) {
        // Validate body của request
        const { error } = validSchema.body.validate(req.body);
        if (error) {
            return res.status(400).json({
                status: 'error',
                message: error.details[0].message
            });
        }

        // Validate params nếu có
        if (validSchema.params) {
            const { error } = validSchema.params.validate(req.params);
            if (error) {
                return res.status(400).json({
                    status: 'error',
                    message: error.details[0].message
                });
            }
        }
    }
    // Nếu không có lỗi, chuyển request đến middleware tiếp theo
    next();
}; 