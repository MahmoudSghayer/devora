import {setRequestLocale} from 'next-intl/server';
import Hero from '@/components/sections/Hero';
import ValueWhy from '@/components/sections/ValueWhy';
import PillarSwitcher from '@/components/sections/PillarSwitcher';
import ScenarioSimulator from '@/components/sections/ScenarioSimulator';
import SelectedWork from '@/components/sections/SelectedWork';
import CalculatorCards from '@/components/sections/CalculatorCards';
import StackConstellation from '@/components/sections/StackConstellation';
import CtaBand from '@/components/sections/CtaBand';

export default async function Page({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  setRequestLocale(locale);
  return (
    <>
      <Hero />
      <ValueWhy />
      <PillarSwitcher />
      <ScenarioSimulator />
      <SelectedWork />
      <CalculatorCards />
      <StackConstellation />
      <CtaBand />
    </>
  );
}
