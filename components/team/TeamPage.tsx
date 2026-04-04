'use client';

import { Linkedin, Twitter, Github } from 'lucide-react';

export default function TeamPage() {
  const teamMembers = [
    {
      name: 'Michael Chen',
      role: 'Chief Executive Officer',
      avatar: '👨‍💼',
      bgColor: 'bg-blue-100',
      description: 'Former blockchain architect at major crypto exchange with 10+ years experience'
    },
    {
      name: 'Sarah Williams',
      role: 'Chief Technology Officer',
      avatar: '👩‍💻',
      bgColor: 'bg-purple-100',
      description: 'Expert in distributed systems and mining infrastructure optimization'
    },
    {
      name: 'David Martinez',
      role: 'Head of Security',
      avatar: '👨‍🔧',
      bgColor: 'bg-teal-100',
      description: 'Cybersecurity specialist focused on blockchain and wallet security'
    },
    {
      name: 'Emily Zhang',
      role: 'Head of Operations',
      avatar: '👩‍💼',
      bgColor: 'bg-orange-100',
      description: 'Manages global mining operations and infrastructure across 168 countries'
    },
    {
      name: 'James Anderson',
      role: 'Lead Developer',
      avatar: '👨‍💻',
      bgColor: 'bg-green-100',
      description: 'Full-stack developer specializing in blockchain and smart contracts'
    },
    {
      name: 'Lisa Park',
      role: 'Community Manager',
      avatar: '👩‍🎓',
      bgColor: 'bg-rose-100',
      description: 'Building and supporting our community of 11+ million users worldwide'
    },
    {
      name: 'Robert Kim',
      role: 'Business Development',
      avatar: '👨‍🎓',
      bgColor: 'bg-indigo-100',
      description: 'Strategic partnerships and expansion into new markets and regions'
    }
  ];

  return (
    <div className="p-3 space-y-3 pb-6">
      {/* Header */}
      <div className="bg-linear-to-br from-blue-500 to-indigo-600 rounded-2xl p-5 text-white">
        <h1 className="text-2xl font-bold mb-2">Our Team</h1>
        <p className="text-sm text-blue-100">
          Meet the talented individuals driving innovation and success at Alpha Mining
        </p>
      </div>

      {/* Team Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl p-3 shadow-sm text-center">
          <p className="text-xl font-bold text-gray-900 mb-1">7</p>
          <p className="text-xs text-gray-500">Core Team</p>
        </div>
        <div className="bg-white rounded-2xl p-3 shadow-sm text-center">
          <p className="text-xl font-bold text-gray-900 mb-1">50+</p>
          <p className="text-xs text-gray-500">Total Staff</p>
        </div>
        <div className="bg-white rounded-2xl p-3 shadow-sm text-center">
          <p className="text-xl font-bold text-gray-900 mb-1">12+</p>
          <p className="text-xs text-gray-500">Countries</p>
        </div>
      </div>

      {/* Team Members */}
      <div className="space-y-3">
        {teamMembers.map((member, index) => (
          <div key={index} className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className={`w-14 h-14 ${member.bgColor} rounded-xl flex items-center justify-center text-2xl shrink-0`}>
                {member.avatar}
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-gray-900">{member.name}</h3>
                <p className="text-sm text-indigo-600 font-medium mb-2">{member.role}</p>
                <p className="text-xs text-gray-500 leading-relaxed mb-3">{member.description}</p>
                <div className="flex gap-2">
                  <button className="p-1.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <Linkedin size={14} className="text-gray-600" />
                  </button>
                  <button className="p-1.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <Twitter size={14} className="text-gray-600" />
                  </button>
                  <button className="p-1.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <Github size={14} className="text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Join Us */}
      <div className="bg-linear-to-br from-purple-500 to-pink-600 rounded-2xl p-5 text-white text-center">
        <h2 className="text-lg font-bold mb-2">Join Our Team</h2>
        <p className="text-sm text-purple-100 mb-4">
          We&apos;re always looking for talented individuals to join our mission
        </p>
        <button className="bg-white text-purple-600 font-bold py-2 px-6 rounded-xl hover:bg-purple-50 transition-colors">
          View Open Positions
        </button>
      </div>
    </div>
  );
}
