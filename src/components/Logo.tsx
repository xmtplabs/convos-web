export type LogoProps = {
  size?: number;
};

export const Logo: React.FC<LogoProps> = ({ size = 32 }) => {
  return (
    <svg
      fill="none"
      viewBox="0 0 28 36"
      height={size}
      shapeRendering="geometricPrecision"
      xmlns="http://www.w3.org/2000/svg">
      <path
        d="M27.7736 13.8868C27.7736 21.5563 21.5563 27.7736 13.8868 27.7736C6.21733 27.7736 0 21.5563 0 13.8868C0 6.21733 6.21733 0 13.8868 0C21.5563 0 27.7736 6.21733 27.7736 13.8868Z"
        fill="#E54D00"
      />
      <path
        d="M13.8868 27.7736L18.0699 35.0189H9.70373L13.8868 27.7736Z"
        fill="#E54D00"
      />
    </svg>
  );
};
