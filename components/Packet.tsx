
import React from 'react';
import { PacketGraphic } from './PacketGraphic';

interface PacketProps {
  name: string;
  tp: number;
  price: number;
  size?: 'small' | 'medium' | 'large';
}

export const Packet: React.FC<PacketProps> = ({ name, tp, price, size = 'medium' }) => {

  return (
    <div className="relative flex flex-col items-center group w-40">
        <PacketGraphic sizeClass={size} tp={tp} />
         <div className="text-center mt-3">
            <p className="text-lg font-bold text-white">{name}</p>
        </div>
    </div>
  );
};
