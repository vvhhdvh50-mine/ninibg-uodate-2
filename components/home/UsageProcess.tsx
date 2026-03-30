'use client';

import { Link2, Pickaxe, Wallet } from 'lucide-react';

export default function UsageProcess() {
  const steps = [
    {
      icon: <Link2 size={24} className="text-teal-600" />,
      bgColor: 'bg-teal-100',
      title: 'Connect Wallet',
      description: 'Tap the "Connect Wallet" button'
    },
    {
      icon: <Pickaxe size={24} className="text-indigo-600" />,
      bgColor: 'bg-indigo-100',
      title: 'Click "Start Mining"',
      description: 'Receive daily proportional earnings'
    },
    {
      icon: <Wallet size={24} className="text-rose-600" />,
      bgColor: 'bg-rose-100',
      title: 'Earn income',
      description: 'Withdraw your profits anytime'
    }
  ];

  return (
    <div className="mt-3 mb-6">
      <h3 className="text-lg font-bold text-gray-400 mb-3">Usage process</h3>
      
      <div className="space-y-3">
        {steps.map((step, index) => (
          <div key={index} className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4">
            <div className={`w-14 h-14 ${step.bgColor} rounded-xl flex items-center justify-center flex-shrink-0`}>
              {step.icon}
            </div>
            <div className="flex-1">
              <h4 className="text-base font-bold text-gray-900 mb-1">{step.title}</h4>
              <p className="text-sm text-gray-500">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
