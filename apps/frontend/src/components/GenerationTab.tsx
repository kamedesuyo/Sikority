import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { GenerationForm } from './GenerationForm';

export const GenerationTab: React.FC = () => {
  return (
    <Tabs defaultValue="generate" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="generate">画像生成</TabsTrigger>
        <TabsTrigger value="evaluate">評価</TabsTrigger>
      </TabsList>
      <TabsContent value="generate" className="mt-4">
        <GenerationForm />
      </TabsContent>
      <TabsContent value="evaluate" className="mt-4">
        {/* 評価タブの内容は既存の実装を使用 */}
      </TabsContent>
    </Tabs>
  );
}; 