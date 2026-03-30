/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useState, useEffect } from 'react';

// Generate random Ethereum addresses
const generateEthAddress = () => {
  const hex = '0123456789ABCDEF';
  let address = '0x';
  for (let i = 0; i < 4; i++) {
    address += hex[Math.floor(Math.random() * 16)];
  }
  address += '***';
  for (let i = 0; i < 4; i++) {
    address += hex[Math.floor(Math.random() * 16)];
  }
  return address;
};

// Generate random USDT quantity
const generateRandomQuantity = () => {
  const rand = Math.random();
  if (rand < 0.3) {
    // Small decimals like 0.23, 0.99
    return (Math.random() * 0.99 + 0.01).toFixed(2);
  } else if (rand < 0.6) {
    // 2-digit whole numbers like 23, 45, 77, 87, 99
    return String(Math.floor(Math.random() * 90 + 10));
  } else {
    // Decimals like 33.23, 45.555
    const whole = Math.floor(Math.random() * 90 + 10);
    const decimal = Math.random() < 0.5
      ? (Math.random() * 0.99 + 0.01).toFixed(2)
      : (Math.random() * 0.999 + 0.001).toFixed(3);
    return `${whole}.${decimal.split('.')[1]}`;
  }
};

// Generate a single user
const generateUser = () => {
  return {
    id: Date.now() + Math.random(),
    address: generateEthAddress(),
    quantity: generateRandomQuantity(),
  };
};

export default function UserBenefits() {
  const [users, setUsers] = useState<Array<{ id: number; address: string; quantity: string }>>([]);

  useEffect(() => {
    // Initialize with 5 users
    const initialUsers = [];
    for (let i = 0; i < 5; i++) {
      initialUsers.push(generateUser());
    }
    setUsers(initialUsers);

    // Add new user every 2 seconds
    const interval = setInterval(() => {
      setUsers((prevUsers) => {
        const newUser = generateUser();
        const updatedUsers = [...prevUsers, newUser];
        // Keep only the last 5 users
        return updatedUsers.slice(-5);
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mt-3 mb-6">
      <h3 className="text-lg font-bold text-gray-400 mb-3">User Benefits</h3>
      
      <div className="bg-white rounded-2xl p-4 shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="flex justify-between items-center pb-3 mb-3 border-b border-gray-200">
          <span className="text-sm font-medium text-gray-500">Address</span>
          <span className="text-sm font-medium text-gray-500">Quantity</span>
        </div>

        {/* Table Rows with Animation */}
        <div className="space-y-3 relative">
          {users.map((user, index) => (
            <div 
              key={user.id}
              className="flex justify-between items-center animate-slide-up"
              style={{
                animation: index === users.length - 1 ? 'slideUp 0.5s ease-out' : 'none'
              }}
            >
              <span className="text-sm text-gray-700 font-mono">{user.address}</span>
              <span className="text-sm font-bold text-teal-600">{user.quantity} USDT</span>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
