'use client';

import { useState } from 'react';
import { Shield, Zap, Globe, Users, TrendingUp, Lock, ChevronDown } from 'lucide-react';

export default function AboutPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: 'What is Alpha Mining?',
      answer: 'Alpha Mining is a decentralized cloud mining platform that allows anyone to earn cryptocurrency rewards without owning or managing physical mining hardware. By pooling computing resources across our global network, we distribute mining profits proportionally to all participants.'
    },
    {
      question: 'How do I start mining?',
      answer: 'Getting started is simple — connect your crypto wallet, activate mining with a single tap, and you begin earning rewards immediately. No technical knowledge, hardware setup, or large upfront investment is required.'
    },
    {
      question: 'Is my wallet and funds safe?',
      answer: 'Absolutely. Alpha Mining is a non-custodial platform, meaning we never hold your private keys or take custody of your funds. Your assets stay in your own wallet at all times, protected by enterprise-grade multi-layer encryption.'
    },
    {
      question: 'How and when are mining rewards distributed?',
      answer: 'Mining rewards are calculated and distributed every 24 hours based on your proportional contribution to the network. Rewards are sent directly to your connected wallet with full transparency — you can track every distribution in real time.'
    },
    {
      question: 'What cryptocurrencies can I mine?',
      answer: 'Alpha Mining supports mining for multiple leading cryptocurrencies. The available assets can be selected through the platform and may vary based on current network conditions and profitability. Check the mining section for the latest supported assets.'
    },
    {
      question: 'Are there any fees?',
      answer: 'Alpha Mining operates on a transparent fee model. A small platform fee is deducted from gross mining earnings to cover infrastructure, maintenance, and operational costs. All fee details are visible before you activate mining — there are no hidden charges.'
    },
    {
      question: 'What are the minimum requirements to join?',
      answer: 'All you need is a compatible crypto wallet and an internet connection. There is no minimum deposit required to start mining. Users with larger balances may unlock higher mining tiers with improved daily yield rates.'
    },
    {
      question: 'How does team or referral mining work?',
      answer: 'You can invite friends and build a team to boost your collective mining power. When your referred users mine actively, you earn a bonus percentage on top of your own rewards. The more active your team, the higher your combined earnings.'
    },
    {
      question: 'Is Alpha Mining available in my country?',
      answer: 'Alpha Mining operates across 168+ countries worldwide. As long as you have access to a crypto wallet and the internet, you can participate. Please ensure you comply with any local regulations regarding cryptocurrency in your region.'
    },
    {
      question: 'Can I mine on a mobile device?',
      answer: 'Yes. Alpha Mining is fully optimized for mobile browsers, so you can manage your mining, track rewards, and monitor your team from any smartphone or tablet without needing to install a separate app.'
    },
    {
      question: 'How do I withdraw my mining rewards?',
      answer: 'Since rewards are distributed directly to your connected wallet, no manual withdrawal step is needed. Once the rewards arrive in your wallet, you can transfer, trade, or hold them as you see fit using any standard crypto exchange or wallet app.'
    },
    {
      question: 'What happens if I stop mining?',
      answer: 'Mining is active only while you have it enabled. If you deactivate or your session expires, rewards accumulation pauses. You can resume at any time — there are no penalties or lock-up periods for stopping and restarting.'
    }
  ];

  const features = [
    {
      icon: <Shield size={24} className="text-teal-600" />,
      bgColor: 'bg-teal-100',
      title: 'Secure Mining',
      description: 'Enterprise-grade security with multi-layer encryption protecting your assets'
    },
    {
      icon: <Zap size={24} className="text-orange-600" />,
      bgColor: 'bg-orange-100',
      title: '24/7 Operations',
      description: 'Automated mining operations running continuously without interruption'
    },
    {
      icon: <Globe size={24} className="text-blue-600" />,
      bgColor: 'bg-blue-100',
      title: 'Global Network',
      description: 'Mining nodes distributed across 168+ countries worldwide'
    },
    {
      icon: <Users size={24} className="text-purple-600" />,
      bgColor: 'bg-purple-100',
      title: 'Community Driven',
      description: 'Join 11+ million active users earning daily mining rewards'
    },
    {
      icon: <TrendingUp size={24} className="text-green-600" />,
      bgColor: 'bg-green-100',
      title: 'High Returns',
      description: 'Competitive daily yields with transparent reward distribution'
    },
    {
      icon: <Lock size={24} className="text-rose-600" />,
      bgColor: 'bg-rose-100',
      title: 'Non-Custodial',
      description: 'Keep full control of your funds in your own wallet at all times'
    }
  ];

  return (
    <div className="p-3 space-y-3 pb-6">
      {/* Hero Section */}
      <div className="bg-linear-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 text-white">
        <h1 className="text-2xl font-bold mb-2">About Alpha Mining</h1>
        <p className="text-sm text-indigo-100 leading-relaxed">
          We are a leading decentralized mining platform that enables users to participate in cryptocurrency mining without the need for expensive hardware or technical expertise.
        </p>
      </div>

      {/* Mission Statement */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-2">Our Mission</h2>
        <p className="text-sm text-gray-600 leading-relaxed mb-3">
          To democratize cryptocurrency mining by providing accessible, secure, and profitable mining opportunities for everyone, regardless of their technical background or initial investment.
        </p>
        <p className="text-sm text-gray-600 leading-relaxed">
          Since our launch, we have distributed over $75 billion in mining rewards to our global community of users, making cryptocurrency mining accessible to millions.
        </p>
      </div>

      {/* Key Features */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-3">Key Features</h2>
        <div className="grid grid-cols-1 gap-3">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className={`w-11 h-11 ${feature.bgColor} rounded-xl flex items-center justify-center flex-shrink-0`}>
                {feature.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-gray-900 mb-1">{feature.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      {/* <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-gray-900 mb-1">168+</p>
          <p className="text-xs text-gray-500">Countries</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-gray-900 mb-1">11.4M</p>
          <p className="text-xs text-gray-500">Active Users</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-gray-900 mb-1">$75B+</p>
          <p className="text-xs text-gray-500">Distributed</p>
        </div>
      </div> */}

      {/* How It Works */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-3">How It Works</h2>
        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">1</div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-1">Connect Your Wallet</h3>
              <p className="text-xs text-gray-500">Link your crypto wallet securely to the platform</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">2</div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-1">Start Mining</h3>
              <p className="text-xs text-gray-500">Activate mining with just one tap and start earning</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">3</div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-1">Earn Daily Rewards</h3>
              <p className="text-xs text-gray-500">Receive proportional mining rewards every 24 hours</p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Frequently Asked Questions</h2>
        <p className="text-xs text-gray-400 mb-4">Tap a question to see the answer</p>
        <div className="space-y-2">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={index}
                className="border border-gray-100 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <span className="text-sm font-semibold text-gray-800 leading-snug">
                    {faq.question}
                  </span>
                  <ChevronDown
                    size={18}
                    className={`shrink-0 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                <div
                  className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                >
                  <div className="overflow-hidden">
                    <p className="px-4 py-3 text-xs text-gray-500 leading-relaxed border-t border-gray-100">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
