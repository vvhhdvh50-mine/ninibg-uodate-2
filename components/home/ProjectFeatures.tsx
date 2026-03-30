'use client';

import { Shield, Pyramid, DoorOpen } from 'lucide-react';

export default function ProjectFeatures() {
  const features = [
    {
      icon: <Shield size={24} className="text-teal-600" />,
      bgColor: 'bg-teal-100',
      title: 'Safe and secure',
      description: 'Keep your USDT or USDC in your own wallet with complete security'
    },
    {
      icon: <Pyramid size={24} className="text-indigo-600" />,
      bgColor: 'bg-indigo-100',
      title: 'Professional stability',
      description: 'Expert team ensuring consistent performance all year round'
    },
    {
      icon: <DoorOpen size={24} className="text-rose-600" />,
      bgColor: 'bg-rose-100',
      title: 'Low entry barrier',
      description: 'Participate in mining revenue sharing'
    }
  ];

  return (
    <div className="mt-3 mb-6">
      <h3 className="text-lg font-bold text-gray-400 mb-3">Project Features</h3>
      
      <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
        {features.map((feature, index) => (
          <div key={index} className="flex items-start gap-4">
            <div className={`w-14 h-14 ${feature.bgColor} rounded-xl flex items-center justify-center flex-shrink-0`}>
              {feature.icon}
            </div>
            <div className="flex-1 pt-1">
              <h4 className="text-base font-bold text-gray-900 mb-1">{feature.title}</h4>
              <p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
