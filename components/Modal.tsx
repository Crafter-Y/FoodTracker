import {
    TouchableOpacity,
    View,
    useWindowDimensions,
} from "react-native";
import React, { forwardRef, useImperativeHandle, useState } from "react";
import ReactNativeModal, { Direction } from "react-native-modal";

type ModalType = "MOBILE_BOTTOM" | "CENTER";

type Props = {
    modalOpenCondition?: boolean;
    children?: React.ReactNode;
    type: ModalType;
    swipeDirection?: Direction | Direction[];
};

export type ModalHandle = {
    toggleModal: () => void;
};

export default forwardRef<ModalHandle, Props>(
    ({ modalOpenCondition = true, children, type, swipeDirection = ["down"] }: Props, ref) => {
        const { height, width } = useWindowDimensions();

        const [isModalOpen, setModalOpen] = useState(false);

        const intToggleModal = () => {
            setModalOpen(!isModalOpen);
        };

        useImperativeHandle(ref, () => ({
            toggleModal() {
                intToggleModal();
            },
        }));

        return (
            <ReactNativeModal
                isVisible={isModalOpen && modalOpenCondition}
                onBackdropPress={intToggleModal}
                swipeDirection={swipeDirection}
                onSwipeComplete={intToggleModal}
                customBackdrop={
                    <TouchableOpacity
                        style={{
                            height,
                            width,
                            backgroundColor: "#000000",
                        }}
                        onPress={intToggleModal}
                    ></TouchableOpacity>
                }
            >
                <View
                    className="shadow-lg rounded-lg"
                    style={{
                        backgroundColor: "#ffffff"
                    }}
                >
                    {children}
                </View>
            </ReactNativeModal>
        );
    }
);
