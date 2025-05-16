export declare const REF_WIDGET_STAR_TOKEN_LIST_KEY = "REF_WIDGET_STAR_TOKEN_LIST_VALUE";
export declare const REF_WIDGET_ALL_TOKENS_LIST_KEY = "REF_WIDGET_ALL_TOKENS_LIST_VALUE";
export declare const REF_WIDGET_ALL_LIGHT_TOKENS_LIST_KEY = "REF_WIDGET_ALL_LIGHT_TOKENS_LIST_VALUE";
export declare const REF_WIDGET_SWAP_IN_KEY = "REF_WIDGET_SWAP_IN_VALUE";
export declare const REF_WIDGET_SWAP_OUT_KEY = "REF_WIDGET_SWAP_OUT_VALUE";
export declare const REF_WIDGET_SWAP_DETAIL_KEY = "REF_WIDGET_SWAP_DETAIL_VALUE";
export declare const DEFAULT_START_TOKEN_LIST_TESTNET: string[];
export declare const DEFAULT_START_TOKEN_LIST_MAINNET: string[];
export interface Theme {
    container: string;
    buttonBg: string;
    primary: string;
    secondary: string;
    borderRadius: string;
    fontFamily: string;
    hover: string;
    active: string;
    secondaryBg: string;
    borderColor: string;
    iconDefault: string;
    iconHover: string;
    refIcon?: string;
}
export declare const defaultTheme: Theme;
export declare const defaultDarkModeTheme: Theme;
