import React from 'react';
import './Card.css';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  padding = 'md',
  hoverable = false,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`mf-card mf-card--padding-${padding} ${hoverable ? 'mf-card--hoverable' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
