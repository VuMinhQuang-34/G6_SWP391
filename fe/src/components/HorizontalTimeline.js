import React from "react";
import { Steps, Avatar } from "antd";

const { Step } = Steps;

const HorizontalTimeline = ({ statusKey, orderStatuses }) => {
    const currentIndex = orderStatuses.findIndex(s => s.key === statusKey);

    return (
        <Steps current={currentIndex} size="small">
            {orderStatuses.map((orderStatus, index) => (
                <Step
                    key={orderStatus.key}
                    title={orderStatus.label}
                    //icon={index == 0 ? <Avatar src="https://online126.vn/upload/news/300x300x1/huong-dan-tao-don-hang-oder1513157445.jpg" /> : null}
                />
            ))}
        </Steps>
    );
};

export default HorizontalTimeline;
