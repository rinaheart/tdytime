import { useEffect, useRef, useState, ReactNode } from 'react';

interface LazyRenderProps {
    children: ReactNode;
    placeholderHeight?: number;
    rootMargin?: string;
}

export function LazyRender({ children, placeholderHeight = 200, rootMargin = '500px' }: LazyRenderProps) {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const node = ref.current;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setIsVisible(true);
                    if (node) observer.unobserve(node);
                }
            },
            { rootMargin }
        );

        if (node) {
            observer.observe(node);
        }

        return () => {
            if (node) observer.unobserve(node);
        };
    }, [rootMargin]);

    if (isVisible) {
        return <>{children}</>;
    }

    return (
        <div ref={ref} style={{ height: placeholderHeight, width: '100%' }} aria-hidden="true" />
    );
}
