/**
 * Global test mock for next/image.
 * Registered in vitest.config.mts resolve.alias so ALL tests get this automatically.
 * Strips Next.js-only props that are not valid DOM attributes.
 * ADR-2: passthrough <img> pattern — precedent for all future component tests.
 */
import React from 'react';

type NextImageProps = {
  src?: string;
  alt?: string;
  width?: number | string;
  height?: number | string;
  className?: string;
  style?: React.CSSProperties;
  // Next.js-only props to strip (not valid DOM attrs):
  fill?: boolean;
  priority?: boolean;
  quality?: number;
  placeholder?: string;
  blurDataURL?: string;
  sizes?: string;
  loading?: string;
  onLoad?: React.ReactEventHandler<HTMLImageElement>;
  onError?: React.ReactEventHandler<HTMLImageElement>;
  [key: string]: unknown;
};

function NextImageMock({
  src,
  alt = '',
  width,
  height,
  className,
  style,
  onLoad,
  onError,
  // Strip Next.js-only props:
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  fill: _fill,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  priority: _priority,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  quality: _quality,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  placeholder: _placeholder,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  blurDataURL: _blurDataURL,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  sizes: _sizes,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  loading: _loading,
  ...rest
}: NextImageProps) {
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      style={style}
      onLoad={onLoad}
      onError={onError}
      {...rest}
    />
  );
}

export default NextImageMock;
