import React from "react";

// Demo cách dùng
// const orderStatuses = [
//     { key: 'New', label: 'Mới' },
//     { key: 'Approve', label: 'Đã phê duyệt' },
//     { key: 'Receive', label: 'Đã nhận hàng' },
//     { key: 'ApproveImport', label: 'Đã phê duyệt nhập' },
//     { key: 'Close', label: 'Đã đóng' },
// ];

//Truyền tham số
//HorizontalTimeline("New", orderStatuses)

//truyền vào status, danh sách status
const HorizontalTimeline = ({ statusKey, orderStatuses }) => {
    const currentIndex = orderStatuses.findIndex(s => s.key === statusKey);

    return (
        <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            position: "relative",
            padding: "20px 0",
        }}>
            {/* Đường thẳng nối tất cả trạng thái */}
            <div style={{
                position: "absolute",
                top: "50%",
                left: "0",
                width: "100%",
                height: "4px",
                backgroundColor: "#ddd",
                transform: "translateY(-50%)",
                zIndex: 0,
            }}></div>

            {orderStatuses.map((orderStatus, index) => {
                const isActive = index <= currentIndex;

                return (
                    <div key={index} style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        position: "relative",
                        flex: 1,
                        textAlign: "center"
                    }}>
                        {/* Label phía trên */}
                        <div style={{
                            fontSize: "14px",
                            fontWeight: isActive ? "bold" : "normal",
                            color: isActive ? "#333" : "#999",
                            marginBottom: "10px",
                            whiteSpace: "nowrap",
                        }}>
                            {orderStatus.label}
                        </div>

                        {/* Biểu tượng trạng thái */}
                        <div style={{
                            width: 20,
                            height: 20,
                            borderRadius: "50%",
                            backgroundColor: isActive ? "#52c41a" : "#ccc",
                            border: "3px solid white",
                            zIndex: 2,
                        }}></div>

                        {/* Đường nối riêng giữa các trạng thái */}
                        {index < orderStatuses.length  && (
                            <div style={{
                                position: "absolute",
                                top: "50%",
                                left: "50%",
                                width: "100%",
                                height: "4px",
                                backgroundColor: isActive ? "#52c41a" : "#ddd",
                                transform: "translateX(-50%) translateY(-50%)",
                                zIndex: 1,
                            }}></div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default HorizontalTimeline;
