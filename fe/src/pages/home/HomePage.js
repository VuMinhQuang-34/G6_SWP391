// fe/src/pages/home/HomePage.js
import React from 'react';
import './HomePage.css'; // Import CSS

const HomePage = () => {
    return (
        <div className="home-container" style={{ position: 'relative', height: '90vh', width: '100%' }}>
            <img 
                // src="https://media.tapchitaichinh.vn/w1480/images/upload/vantruongtc/03252022/cn1403v1.jpg" 
                src="https://www.elle.vn/app/uploads/2020/03/23/394939/kho-tai-sach-mien-phi.jpg" 
                alt="Home" 
                className="fullscreen-image" 
                style={{height: '100%', width: '100%'}}
            />
            {/* Nội dung khác có thể được thêm vào đây nếu cần */}
        </div>
    );
};

export default HomePage;