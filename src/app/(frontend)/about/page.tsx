'use client'

import React from 'react'
import { motion } from 'motion/react'
import { MainbarShell, SidebarShell } from '@/components/layout/FrontendShell'

export default function AboutPage() {
  return (
    <SidebarShell>
      <MainbarShell>
        <div className="max-w-4xl mx-auto px-6 py-12 space-y-20">
          
          {/* Header Section */}
          <section className="space-y-6">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-6xl font-bold tracking-tight"
            >
              ABOUT US
            </motion.h1>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="prose prose-neutral dark:prose-invert max-w-none"
            >
              <p className="text-xl text-muted-foreground leading-relaxed">
                Welcome to the IoT and Embedded Systems Club at <strong>P.A. College of Engineering (PACE)</strong>. 
                We are a community of student tech enthusiasts dedicated to self-learning, collaboration, 
                and hands-on innovation in the fields of embedded systems and computer science.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Our club provides a platform for students to explore, experiment, and create with technology. 
                We organize events, workshops, and projects that allow members to gain hands-on experience 
                and expand their knowledge in this exciting field.
              </p>
            </motion.div>
          </section>

          {/* Mission & Vision Grid */}
          <div className="grid md:grid-cols-2 gap-12">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="p-8 rounded-2xl bg-card border border-border/50 shadow-sm space-y-4"
            >
              <h2 className="text-2xl font-bold">🎯 Mission</h2>
              <p className="text-muted-foreground leading-relaxed italic">
                "We are dedicated to advancing knowledge and expertise in embedded systems and IoT. 
                Our mission is to foster a community of passionate learners and innovators who collaborate, 
                create, and make a positive impact through technology."
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="p-8 rounded-2xl bg-card border border-border/50 shadow-sm space-y-4"
            >
              <h2 className="text-2xl font-bold">🔭 Vision</h2>
              <p className="text-muted-foreground leading-relaxed italic">
                "Our vision is to be a leading hub for innovation in embedded systems and IoT. 
                Our goal is to inspire and educate the next generation of engineers and problem solvers 
                who will shape the future of technology."
              </p>
            </motion.div>
          </div>

          {/* Core Objectives (History) */}
          <section className="space-y-8">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold">🏛️ Our History</h2>
              <p className="text-muted-foreground">
                Embed Club was inaugurated on <strong>14th November 2018</strong> at PACE with the following core objectives:
              </p>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-6">
              {[
                { title: "Infrastructure", desc: "Creating a community with infrastructure to help technical minds." },
                { title: "Knowledge Transfer", desc: "Connecting experienced mentors and newbies to transfer knowledge." },
                { title: "Innovation", desc: "Connecting like-minded technocrats to generate ideas and products." },
                { title: "Open Lab", desc: "Building an Open Lab with latest hardware through contributions." }
              ].map((obj, i) => (
                <motion.div 
                  key={obj.title}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="p-6 rounded-xl border border-border/40 bg-background/50"
                >
                  <h3 className="font-bold text-lg mb-1">{obj.title}</h3>
                  <p className="text-sm text-muted-foreground">{obj.desc}</p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Founders & Team */}
          <section className="p-10 rounded-3xl bg-neutral-900 text-white dark:bg-white dark:text-black space-y-6">
            <h2 className="text-3xl font-bold">👥 The Team & Founders</h2>
            <p className="leading-relaxed opacity-90">
              Embed Club emerged from the collective vision and dedication of its core founding members: 
              <strong> Habeeb Ur Rehman, Nishant Narayanan, and Mohammed Saifuddin.</strong>
            </p>
            <p className="leading-relaxed opacity-90">
              Our team is renowned for the ongoing contributions of its alumni members. 
              Alumni play a vital role in fostering the growth of the club by leveraging their industry 
              experience to train current students through workshops, mentorship, and guest lectures.
            </p>
            <div className="pt-4 border-t border-white/10 dark:border-black/10">
              <p className="text-sm opacity-70">
                Founding Student Members (2018-2020): Hashir Abdullah, Mohammed Irfan, Saiful Aseem, 
                Rumaiz Abdullah, Mohammed Shakir, Mohammed Shayiz, and Marzook.
              </p>
            </div>
          </section>

          {/* Educational Philosophy */}
          <section className="prose prose-neutral dark:prose-invert max-w-none pb-20">
            <h2 className="text-3xl font-bold">⚡ Activities & Philosophy</h2>
            <p>
              Embedded system education is an enormous challenge for universities because it lies at the 
              intersection of different disciplines and is in constant rapid progress. 
            </p>
            <div className="grid md:grid-cols-3 gap-8 mt-10 not-prose">
              {[
                { title: "Sharing Experience", desc: "Forming a technology community to exchange insights." },
                { title: "Intensive Practice", desc: "Extra-curricular team tasks to master skills." },
                { title: "Industry Insight", desc: "Receiving updates on progress from senior engineers." }
              ].map((item, i) => (
                <div key={item.title} className="space-y-2">
                  <div className="text-2xl font-bold text-primary opacity-20">0{i+1}</div>
                  <h4 className="font-bold">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

        </div>
      </MainbarShell>
    </SidebarShell>
  )
}
