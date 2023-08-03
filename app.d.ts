/// <reference types="nativewind/types" />

type PieChartData = {
    value: number;
    shiftX?: number;
    shiftY?: number;
    color?: string;
    gradientCenterColor?: string;
    text?: string;
    textColor?: string;
    textSize?: number;
    fontStyle?: FontStyle;
    fontWeight?: string;
    font?: string;
    textBackgroundColor?: string;
    textBackgroundRadius?: number;
    shiftTextX?: number;
    shiftTextY?: number;
    labelPosition?: 'onBorder' | 'outward' | 'inward' | 'mid';
    onPress?: Function;
    onLabelPress?: Function;
    strokeWidth?: number;
    strokeColor?: string;
    focused?: boolean;
};