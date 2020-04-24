export interface NavigationData {
    [key: string]: string;
}

export interface NavigationState {
    pageTypeId: string;
    navigationData?: NavigationData | null;
}

export interface NavigationService {
    navigateBackward(): void;
    navigateForward(): void;
    pushState(state: NavigationState): void;
    replaceState(state: NavigationState): void;
}
