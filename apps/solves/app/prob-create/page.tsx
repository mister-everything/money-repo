"use client";

import { motion } from "framer-motion";
import { Image, Menu, Monitor, Sparkles } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { authClient } from "@/lib/auth/client";

const LightRays = dynamic(() => import("@/components/ui/light-rays"), {
  ssr: false,
});

const Particles = dynamic(() => import("@/components/ui/particles"), {
  ssr: false,
});

export default function ProbCreatePage() {
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const [showEffects, setShowEffects] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowEffects(false);
    }, 10000); // 10초 후 효과 숨김

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background Effects */}
      {showEffects && (
        <motion.div
          className="absolute inset-0 z-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2 }}
        >
          <LightRays
            raysOrigin="top-center"
            raysColor="#ffffff"
            raysSpeed={0.8}
            lightSpread={1.2}
            rayLength={1.5}
            pulsating={true}
            fadeDistance={1.0}
          />
          <Particles
            particleCount={300}
            particleBaseSize={8}
            speed={0.5}
            alphaParticles={true}
            particleSpread={15}
          />
        </motion.div>
      )}

      <div className="flex items-center justify-center min-h-screen p-4 relative z-10">
        {/* Hamburger Menu */}
        <Button
          variant="outline"
          size="sm"
          className="absolute top-6 left-6 bg-black/50 border-white/30 text-white hover:bg-white/10"
        >
          <Menu className="w-4 h-4" />
        </Button>
        <Button
          // variant="outline"
          size="sm"
          className="absolute top-6 right-6 bg-black/50 border-white/30 text-white hover:bg-white/10"
        >
          <Avatar
            className={`border size-6 hover:z-10 relative transition-transform hover:scale-110`}
          >
            <AvatarImage src={"/images/avatar.png"} />
            <AvatarFallback>{"A"}</AvatarFallback>
          </Avatar>
        </Button>

        {/* Main Content Card */}
        <motion.div
          className="w-full max-w-6xl"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <Card className="bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 border-0 shadow-none">
            <CardContent className="p-8 md:p-12">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                {/* Left Section - Text */}
                <motion.div
                  className="space-y-4"
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                >
                  <motion.h2
                    className="text-white text-3xl md:text-4xl font-bold leading-tight"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                  >
                    {user?.name || "사용자"}! 오늘 무엇을 하고 있어요?
                  </motion.h2>
                  <motion.p
                    className="text-white text-lg opacity-90"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1, duration: 0.6 }}
                  >
                    AI에게 문제집을 만들어달라고 부탁해보세요.
                  </motion.p>
                </motion.div>

                {/* Right Section - Input & Controls */}
                <motion.div
                  className="space-y-4"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                >
                  {/* Input Field */}
                  <div className="relative">
                    <Textarea
                      placeholder="아무거나 물어보거나 @mention 하세요"
                      className="w-full h-24 bg-black/20 border-white/30 text-white placeholder:text-white/60 rounded-xl resize-none"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-black/20 border-white/30 text-white hover:bg-white/10"
                      >
                        <Image className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-black/20 border-white/30 text-white hover:bg-white/10"
                      >
                        <Monitor className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-white/60 text-sm">Tools 2</span>
                      <Button
                        size="lg"
                        className="bg-pink-500 hover:bg-pink-600 text-white px-6 rounded-xl flex items-center gap-2"
                      >
                        <Sparkles className="w-5 h-5" />
                        문제집 생성
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
