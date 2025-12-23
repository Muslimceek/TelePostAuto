import React, { useState } from 'react';
import { SupportedLanguage } from '../types';
import { useI18n } from '../services/i18n';

interface OnboardingProps {
  onComplete: () => void;
  language: SupportedLanguage;
}

const onboardingSteps = [
  {
    id: 1,
    title: {
      ru: 'Добро пожаловать',
      en: 'Welcome',
      uz: 'Xush kelibsiz',
      kg: 'Кош келдиңиз',
      tj: 'Хуш омадед'
    },
    description: {
      ru: 'AI-система для автоматизации контента в исламских каналах',
      en: 'AI system for content automation in Islamic channels',
      uz: 'Islomiy kanallar uchun kontent avtomatlashtirish AI tizimi',
      kg: 'Исламдык каналдар үчүн контент автоматташтыруу AI системасы',
      tj: 'Системаи AI барои автоматикунонии мундариҷа дар каналҳои исломӣ'
    },
    icon: (
      <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2z" />
      </svg>
    ),
    gradient: 'from-[#8b6f47] via-[#d4a574] to-[#a6895f]'
  },
  {
    id: 2,
    title: {
      ru: 'Умная генерация',
      en: 'Smart Generation',
      uz: 'Aqlli yaratish',
      kg: 'Акылдуу генерация',
      tj: 'Генератсияи зирак'
    },
    description: {
      ru: 'Автоматически создавайте вирусный контент с помощью AI',
      en: 'Automatically create viral content with AI',
      uz: 'AI yordamida virusli kontentni avtomatik yarating',
      kg: 'AI менен вирустуу контентти автоматтык түрдө түзүңүз',
      tj: 'Бо AI мундариҷаи вирусӣ ба таври худкор эҷод кунед'
    },
    icon: (
      <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
      </svg>
    ),
    gradient: 'from-[#2d1b4e] via-[#4a2c5a] to-[#3d2b5e]'
  },
  {
    id: 3,
    title: {
      ru: 'Автопилот',
      en: 'Autopilot',
      uz: 'Avtopilot',
      kg: 'Автопилот',
      tj: 'Автопилот'
    },
    description: {
      ru: 'Настройте расписание публикаций и расслабьтесь',
      en: 'Set up posting schedule and relax',
      uz: 'Nashr jadvalini sozlang va dam oling',
      kg: 'Жарыялоо графигин орнотуп, эс алыңыз',
      tj: 'Ҷадвали нашрро танзим карда, ором гиред'
    },
    icon: (
      <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    gradient: 'from-[#6f4e37] via-[#8b6f47] to-[#5c4033]'
  },
  {
    id: 4,
    title: {
      ru: 'Аналитика',
      en: 'Analytics',
      uz: 'Tahlil',
      kg: 'Аналитика',
      tj: 'Таҳлил'
    },
    description: {
      ru: 'Отслеживайте производительность и оптимизируйте контент',
      en: 'Track performance and optimize content',
      uz: 'Ishlashni kuzating va kontentni optimallashtiring',
      kg: 'Ишке ашырууну көзөмөлдөп, контентти оптималдаштырыңыз',
      tj: 'Фаъолиятро пайгирӣ карда, мундариҷаро оптимизатсия кунед'
    },
    icon: (
      <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    gradient: 'from-[#8b6f47] via-[#d4a574] to-[#6f4e37]'
  }
];

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete, language }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const t = useI18n(language);
  const step = onboardingSteps[currentStep];

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const getText = (obj: Record<SupportedLanguage, string>) => {
    return obj[language] || obj.en;
  };

  return (
    <div className="fixed inset-0 z-[999] bg-[#0a0a0f] flex flex-col items-center justify-center p-6">
      {/* Background Gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${step.gradient} opacity-10 blur-3xl`} />
      
      {/* Content */}
      <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
        {/* Icon */}
        <div className={`mb-12 w-32 h-32 rounded-[3rem] bg-gradient-to-br ${step.gradient} flex items-center justify-center shadow-2xl transform transition-all duration-500 ${currentStep > 0 ? 'scale-90' : 'scale-100'}`}>
          <div className="text-white">
            {step.icon}
          </div>
        </div>

        {/* Text Content */}
        <div className="text-center mb-12 space-y-4">
          <h1 className="text-4xl font-black text-white tracking-tight">
            {getText(step.title)}
          </h1>
          <p className="text-lg text-white/60 leading-relaxed px-4 font-medium">
            {getText(step.description)}
          </p>
        </div>

        {/* Progress Dots */}
        <div className="flex gap-3 mb-12">
          {onboardingSteps.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentStep
                  ? 'w-8 bg-white'
                  : index < currentStep
                  ? 'w-2 bg-white/40'
                  : 'w-2 bg-white/20'
              }`}
            />
          ))}
        </div>

        {/* Buttons */}
        <div className="w-full space-y-4">
          <button
            onClick={handleNext}
            className="w-full bg-white text-black font-black py-5 rounded-[2rem] text-lg tracking-tight shadow-2xl ios-btn-active"
          >
            {currentStep < onboardingSteps.length - 1 ? (language === 'ru' ? 'Далее' : language === 'uz' ? 'Keyingi' : language === 'kg' ? 'Кийинки' : language === 'tj' ? 'Баъдӣ' : 'Next') : (language === 'ru' ? 'Начать' : language === 'uz' ? 'Boshlash' : language === 'kg' ? 'Баштоо' : language === 'tj' ? 'Оғоз' : 'Get Started')}
          </button>
          
          {currentStep < onboardingSteps.length - 1 && (
            <button
              onClick={handleSkip}
              className="w-full text-white/60 font-bold py-4 text-base ios-btn-active"
            >
              {language === 'ru' ? 'Пропустить' : language === 'uz' ? "O'tkazib yuborish" : language === 'kg' ? 'Өткөрүп жиберүү' : language === 'tj' ? 'Гузаронидан' : 'Skip'}
            </button>
          )}
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/50 to-transparent pointer-events-none" />
    </div>
  );
};

