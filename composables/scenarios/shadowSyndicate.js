// scenarios/shadowSyndicate.js
export const shadowSyndicate = {
    id: 'shadow-syndicate',
    title: 'The Shadow Syndicate',
    description: 'A tale of intrigue in the criminal underworld where trust is currency and betrayal is always profitable... for someone.',
    
    firstRoundScenes: [
      {
        id: 'tavern-meeting',
        title: 'The Rusty Anchor Deal',
        description: 'In a dimly lit basement of The Rusty Anchor tavern, an unexpected opportunity presents itself.',
        narration: [
          "Fascinating... your potential partner had quite an interesting conversation before you arrived.",
          "The question is - do you trust their convenient explanation of where they were?"
        ],
        skillCheck: { name: 'Deception', dcCheck: 12 }
      },
      {
        id: 'warehouse-proposition',
        title: 'The Warehouse Proposition',
        description: 'A last-minute change brings you to an abandoned warehouse, where shadows hide intentions.',
        narration: [
          "Such an interesting choice of location... especially given their earlier meeting here.",
          "Would you like to know who else they spoke with?"
        ],
        skillCheck: { name: 'Deception', dcCheck: 11 }
      },
      {
        id: 'rooftop-encounter',
        title: 'The Rooftop Encounter',
        description: 'High above the city streets, a clandestine meeting offers both opportunity and risk.',
        narration: [
          "The view is quite spectacular, isn't it? Though I wonder why they chose such an... exposed location.",
          "Perhaps it has something to do with their previous encounter here last week?"
        ],
        skillCheck: { name: 'Deception', dcCheck: 13 }
      }
    ],
  
    sceneMatrix: {
      2: { // Round 2 scenes
        BOTH_COOPERATE: {
          id: 'vault-discovery',
          title: 'The Hidden Vault',
          description: 'Your mutual cooperation reveals a hidden vault with unprecedented security measures.',
          narration: [
            "How touching, this display of trust. Though I noticed their interest in the secondary entrance.",
            "The one they didn't mention to you."
          ],
          skillCheck: { name: 'Deception', dcCheck: 13 }
        },
        BOTH_BETRAY: {
          id: 'vault-chaos',
          title: 'The Compromised Vault',
          description: 'In the aftermath of mutual betrayal, the vault\'s security shows unexpected vulnerabilities.',
          narration: [
            "Trust shatters so beautifully, doesn't it? Though in the chaos, new opportunities arise.",
            "Would you like to know what they missed in their haste?"
          ],
          skillCheck: { name: 'Deception', dcCheck: 14 }
        },
        BOTH_NEGOTIATE: {
          id: 'vault-tension',
          title: 'The Tense Exchange',
          description: 'Cautious negotiations lead to a delicate balance of shared information about the vault.',
          narration: [
            "Such careful dancers, both of you. Though someone's steps seem... rehearsed.",
            "Shall we discuss what they're really planning?"
          ],
          skillCheck: { name: 'Deception', dcCheck: 12 }
        },
        PLAYER_BETRAY_AI_COOPERATE: {
          id: 'vault-advantage',
          title: 'The Upper Hand',
          description: 'Your partner\'s trust has given you a significant advantage in the vault operation.',
          narration: [
            "They suspect nothing of your... alternative arrangements.",
            "How delicious that their trust makes them so vulnerable."
          ],
          skillCheck: { name: 'Deception', dcCheck: 15 }
        },
        PLAYER_COOPERATE_AI_BETRAY: {
          id: 'vault-betrayal',
          title: 'The Bitter Lesson',
          description: 'Your trust was misplaced; your partner has secured key vault information without you.',
          narration: [
            "Ah, the price of trust. Though perhaps this betrayal could work in your favor...",
            "Would you like to know what they overlooked in their moment of triumph?"
          ],
          skillCheck: { name: 'Deception', dcCheck: 11 }
        },
        PLAYER_NEGOTIATE_AI_COOPERATE: {
          id: 'vault-caution',
          title: 'The Measured Approach',
          description: 'Your careful probing reveals more about the vault while maintaining distance.',
          narration: [
            "Interesting how your caution makes them try harder to prove themselves.",
            "Though their eagerness to share might have... other motivations."
          ],
          skillCheck: { name: 'Deception', dcCheck: 13 }
        },
        PLAYER_COOPERATE_AI_NEGOTIATE: {
          id: 'vault-imbalance',
          title: 'The Uneven Exchange',
          description: 'Your openness meets calculated reservation, creating an information imbalance.',
          narration: [
            "Your transparency is admirable. Their careful responses... less so.",
            "Perhaps you'd like to know what they're holding back?"
          ],
          skillCheck: { name: 'Deception', dcCheck: 12 }
        },
        PLAYER_BETRAY_AI_NEGOTIATE: {
          id: 'vault-deception',
          title: 'The Complex Web',
          description: 'A multilayered game of deception unfolds around the vault\'s secrets.',
          narration: [
            "Such an intricate dance of half-truths and hidden motives.",
            "Though they're better at this game than they appear..."
          ],
          skillCheck: { name: 'Deception', dcCheck: 14 }
        },
        PLAYER_NEGOTIATE_AI_BETRAY: {
          id: 'vault-defense',
          title: 'The Prudent Defense',
          description: 'Your cautious approach minimizes the damage from their betrayal.',
          narration: [
            "Your instincts served you well. Though there's still more to uncover...",
            "Would you like to know what they're really after?"
          ],
          skillCheck: { name: 'Deception', dcCheck: 13 }
        }
      },
  
      3: { // Round 3 scenes
        BOTH_COOPERATE: {
          id: 'escape-trust',
          title: 'The Secret Route',
          description: 'Your continued partnership reveals hidden escape routes through the old tunnel system.',
          narration: [
            "Two rounds of trust? How quaint. Though I wonder if they're building trust only to...",
            "Never mind. I'm sure their questions about the tunnel capacity were innocent."
          ],
          skillCheck: { name: 'Deception', dcCheck: 14 }
        },
        BOTH_BETRAY: {
          id: 'escape-chaos',
          title: 'The Chaotic Flight',
          description: 'With trust destroyed, both parties scramble to secure their own escape routes.',
          narration: [
            "Chaos does make things interesting, doesn't it? Everyone scurrying for safety...",
            "Though some routes are more secure than others. Would you like to know which?"
          ],
          skillCheck: { name: 'Deception', dcCheck: 15 }
        },
        // ... Continuing in next part
        BOTH_NEGOTIATE: {
            id: 'escape-calculated',
            title: 'The Measured Withdrawal',
            description: 'Both parties carefully plan contingency routes while maintaining a facade of cooperation.',
            narration: [
              "Such delicate negotiations... each word carefully chosen, each route... contingent.",
              "Though their backup plans have backup plans, don't they?"
            ],
            skillCheck: { name: 'Deception', dcCheck: 13 }
          },
          PLAYER_BETRAY_AI_COOPERATE: {
            id: 'escape-advantage',
            title: 'The Perfect Setup',
            description: 'Their trust in the escape plan gives you the perfect opportunity to disappear.',
            narration: [
              "They've mapped out every route... shared every detail... so trusting.",
              "Such a shame they won't be using that information themselves."
            ],
            skillCheck: { name: 'Deception', dcCheck: 16 }
          },
          PLAYER_COOPERATE_AI_BETRAY: {
            id: 'escape-abandoned',
            title: 'The Empty Rendezvous',
            description: 'You arrive at the meeting point only to find they\'ve already gone, taking crucial resources.',
            narration: [
              "Waiting for someone who's already gone... how unfortunate.",
              "Though they did leave something behind... something they'll desperately miss."
            ],
            skillCheck: { name: 'Deception', dcCheck: 12 }
          },
          PLAYER_NEGOTIATE_AI_COOPERATE: {
            id: 'escape-leverage',
            title: 'The Careful Navigator',
            description: 'Your cautious planning gives you control over the escape timing.',
            narration: [
              "They've shared everything, while you've kept your options open. Wise.",
              "Would you like to know which of their backup routes they haven't mentioned?"
            ],
            skillCheck: { name: 'Deception', dcCheck: 14 }
          },
          PLAYER_COOPERATE_AI_NEGOTIATE: {
            id: 'escape-exposure',
            title: 'The Vulnerable Position',
            description: 'Your openness about escape plans leaves you exposed to their careful maneuvering.',
            narration: [
              "Your honesty is admirable. Their selective sharing... less so.",
              "Perhaps you'd like to know what they're really preparing for?"
            ],
            skillCheck: { name: 'Deception', dcCheck: 13 }
          },
          PLAYER_BETRAY_AI_NEGOTIATE: {
            id: 'escape-gambit',
            title: 'The Double Cross',
            description: 'You plant false escape plans while they carefully probe for your true intentions.',
            narration: [
              "A fascinating game of cat and mouse... though who's who remains to be seen.",
              "Their caution might be warranted, mightn't it?"
            ],
            skillCheck: { name: 'Deception', dcCheck: 15 }
          },
          PLAYER_NEGOTIATE_AI_BETRAY: {
            id: 'escape-foresight',
            title: 'The Prepared Defense',
            description: 'Your cautious planning helps you avoid their carefully laid trap.',
            narration: [
              "Your instincts were right... their betrayal was almost elegant.",
              "Would you like to know where they actually went?"
            ],
            skillCheck: { name: 'Deception', dcCheck: 14 }
          }
        },
    
        4: { // Round 4 scenes
          BOTH_COOPERATE: {
            id: 'investigation-unity',
            title: 'The United Front',
            description: 'Together you face mounting pressure from rival factions investigating the operation.',
            narration: [
              "Such consistent cooperation... almost suspicious, isn't it?",
              "Though I noticed they've been asking questions about internal investigations..."
            ],
            skillCheck: { name: 'Deception', dcCheck: 15 }
          },
          BOTH_BETRAY: {
            id: 'investigation-mayhem',
            title: 'The Total Meltdown',
            description: 'All pretense of cooperation shatters as accusations fly from both sides.',
            narration: [
              "When everyone's a traitor, who can be trusted? Delicious chaos.",
              "Though in this mess, someone left quite an interesting trail..."
            ],
            skillCheck: { name: 'Deception', dcCheck: 16 }
          },
          BOTH_NEGOTIATE: {
            id: 'investigation-dance',
            title: 'The Careful Dance',
            description: 'A delicate balance of shared alibis and careful omissions keeps you both afloat.',
            narration: [
              "Such precise choreography... each statement measured, each alibi... flexible.",
              "Though someone's been practicing their steps a bit too much."
            ],
            skillCheck: { name: 'Deception', dcCheck: 14 }
          },
          PLAYER_BETRAY_AI_COOPERATE: {
            id: 'investigation-frame',
            title: 'The Perfect Scapegoat',
            description: 'Their trust in your shared alibi makes them the perfect fall person.',
            narration: [
              "They're so committed to protecting you... how touching.",
              "Shame about all that evidence pointing their way."
            ],
            skillCheck: { name: 'Deception', dcCheck: 17 }
          },
          PLAYER_COOPERATE_AI_BETRAY: {
            id: 'investigation-blindside',
            title: 'The Shocking Betrayal',
            description: 'Your loyal defense of their actions comes crashing down as they present damning evidence against you.',
            narration: [
              "Such loyalty... right until they presented their 'evidence'.",
              "Though they might have overlooked something rather crucial..."
            ],
            skillCheck: { name: 'Deception', dcCheck: 13 }
          },
          PLAYER_NEGOTIATE_AI_COOPERATE: {
            id: 'investigation-control',
            title: 'The Information Master',
            description: 'Your careful management of information keeps you protected while they remain exposed.',
            narration: [
              "They've given you quite a strong position, haven't they?",
              "Their trust could be so much more... profitable."
            ],
            skillCheck: { name: 'Deception', dcCheck: 15 }
          },
          PLAYER_COOPERATE_AI_NEGOTIATE: {
            id: 'investigation-risk',
            title: 'The Vulnerable Defense',
            description: 'Your strong defense of them contrasts with their careful distance from you.',
            narration: [
              "Your loyalty is admirable. Their careful distancing... concerning.",
              "Would you like to know what they're preparing?"
            ],
            skillCheck: { name: 'Deception', dcCheck: 14 }
          },
          PLAYER_BETRAY_AI_NEGOTIATE: {
            id: 'investigation-complex',
            title: 'The Intricate Trap',
            description: 'Your attempt to frame them meets their careful groundwork of deniability.',
            narration: [
              "Quite the web you're weaving... though they've laid some threads of their own.",
              "This could go either way, couldn't it?"
            ],
            skillCheck: { name: 'Deception', dcCheck: 16 }
          },
          PLAYER_NEGOTIATE_AI_BETRAY: {
            id: 'investigation-shield',
            title: 'The Careful Shield',
            description: 'Your measured approach helps deflect their attempts to implicate you.',
            narration: [
              "Your caution served you well... their evidence seems less compelling now.",
              "Though there's still the matter of their hidden testimony..."
            ],
            skillCheck: { name: 'Deception', dcCheck: 15 }
          }
        },
    
        5: { // Round 5 scenes
            BOTH_COOPERATE: {
              id: 'final-trust',
              title: 'The Ultimate Prize',
              description: 'A legendary opportunity presents itself, one that requires absolute trust to achieve.',
              narration: [
                "Complete cooperation until the very end. How... unusual.",
                "Though the greatest prizes are often claimed alone, aren't they?"
              ],
              skillCheck: { name: 'Deception', dcCheck: 16 }
            },
            BOTH_BETRAY: {
              id: 'final-chaos',
              title: 'The Total Collapse',
              description: 'All pretense of cooperation vanishes as you both make your final moves.',
              narration: [
                "Everything burns so beautifully, doesn't it? Though in the ashes...",
                "Someone always finds something valuable."
              ],
              skillCheck: { name: 'Deception', dcCheck: 17 }
            },
            BOTH_NEGOTIATE: {
              id: 'final-balance',
              title: 'The Delicate Agreement',
              description: 'A complex arrangement of compromises and contingencies marks your final deal.',
              narration: [
                "Such elaborate precautions... each clause carefully worded.",
                "Though contracts are only as good as the trust behind them."
              ],
              skillCheck: { name: 'Deception', dcCheck: 15 }
            },
            PLAYER_BETRAY_AI_COOPERATE: {
              id: 'final-masterstroke',
              title: 'The Perfect Betrayal',
              description: 'Their unwavering trust sets up the perfect final betrayal.',
              narration: [
                "They never saw it coming, did they? All that trust...",
                "Makes the final move so much sweeter."
              ],
              skillCheck: { name: 'Deception', dcCheck: 18 }
            },
            PLAYER_COOPERATE_AI_BETRAY: {
              id: 'final-downfall',
              title: 'The Ultimate Betrayal',
              description: 'Your loyalty becomes your downfall as they reveal their true colors.',
              narration: [
                "Such faithful cooperation... right until the end.",
                "Though revenge can be so... satisfying."
              ],
              skillCheck: { name: 'Deception', dcCheck: 14 }
            },
            PLAYER_NEGOTIATE_AI_COOPERATE: {
              id: 'final-advantage',
              title: 'The Strategic Victory',
              description: 'Your careful planning pays off as they commit fully to a compromised plan.',
              narration: [
                "They've given you everything you need, haven't they?",
                "The question is - how will you use it?"
              ],
              skillCheck: { name: 'Deception', dcCheck: 16 }
            },
            PLAYER_COOPERATE_AI_NEGOTIATE: {
              id: 'final-vulnerability',
              title: 'The Last Stand',
              description: 'Your open commitment contrasts sharply with their careful hedging.',
              narration: [
                "Still holding to your principles? How... principled.",
                "Though principles rarely buy freedom, do they?"
              ],
              skillCheck: { name: 'Deception', dcCheck: 15 }
            },
            PLAYER_BETRAY_AI_NEGOTIATE: {
              id: 'final-gambit',
              title: 'The Ultimate Gambit',
              description: 'Your betrayal meets their careful preparations in a final clash of wits.',
              narration: [
                "A bold move... though they've been expecting something like this.",
                "The question is - who's really prepared?"
              ],
              skillCheck: { name: 'Deception', dcCheck: 17 }
            },
            PLAYER_NEGOTIATE_AI_BETRAY: {
              id: 'final-defense',
              title: 'The Last Defense',
              description: 'Your caution proves vital as they launch their final betrayal.',
              narration: [
                "You saw this coming, didn't you? Though perhaps not all of it...",
                "There's still time for one last surprise."
              ],
              skillCheck: { name: 'Deception', dcCheck: 16 }
            }
          }
        },
      
        baseChoices: {
          cooperate: {
            text: 'Honor the Agreement',
            description: 'Maintain trust and cooperation',
            bonuses: [
              { type: 'trust', value: 1, description: 'Building Trust' }
            ],
            outcomes: {
              success: {
                points: 3,
                description: 'Your loyalty strengthens the partnership.'
              },
              failure: {
                points: 1,
                description: 'Your attempt at cooperation falters.'
              }
            }
          },
          negotiate: {
            text: 'Cautious Approach',
            description: 'Seek middle ground while protecting interests',
            bonuses: [
              { type: 'insight', value: 1, description: 'Gathering Intel' }
            ],
            outcomes: {
              success: {
                points: 4,
                description: 'Your careful approach yields valuable insights.'
              },
              failure: {
                points: 2,
                description: 'Your attempts at negotiation fall short.'
              }
            }
          },
          betray: {
            text: 'Seize Advantage',
            description: 'Pursue personal gain at their expense',
            bonuses: [
              { type: 'leverage', value: 2, description: 'Gaining Leverage' }
            ],
            outcomes: {
              success: {
                points: 5,
                description: 'Your betrayal succeeds perfectly.'
              },
              failure: {
                points: 0,
                description: 'Your betrayal backfires dramatically.'
              }
            }
          }
        },
      
        // Define potential modifiers based on game state
        modifiers: {
          consecutive_cooperation: {
            threshold: 2,
            effects: {
              trustBonus: 1,
              dcAdjustment: -1,
              description: 'A foundation of trust has been built.'
            }
          },
          consecutive_betrayal: {
            threshold: 2,
            effects: {
              leverageBonus: 2,
              dcAdjustment: 1,
              description: 'The atmosphere is thick with suspicion.'
            }
          },
          mixed_strategy: {
            threshold: 3,
            effects: {
              insightBonus: 1,
              description: 'Your unpredictable behavior provides advantages.'
            }
          }
        },
      
        // Special outcomes for consistent patterns
        patternOutcomes: {
          perfect_cooperation: {
            requirement: 5,
            bonus: 5,
            description: 'Your unwavering loyalty has created incredible opportunities.'
          },
          perfect_betrayal: {
            requirement: 5,
            bonus: 5,
            description: 'Your consistent betrayals have left you in a powerful position.'
          },
          master_negotiator: {
            requirement: 4,
            bonus: 3,
            description: 'Your diplomatic skills have earned you respect and influence.'
          }
        },
      
        outcomeMatrix: {
          BOTH_COOPERATE: {
            playerPoints: 3,
            aiPoints: 3,
            dmPoints: 0,
            narrative: "Trust prevails as both parties honor their commitments."
          },
          BOTH_BETRAY: {
            playerPoints: 1,
            aiPoints: 1,
            dmPoints: 3,
            narrative: "Mutual betrayal leaves both parties weakened."
          },
          BOTH_NEGOTIATE: {
            playerPoints: 4,
            aiPoints: 4,
            dmPoints: 1,
            narrative: "A careful dance of compromise leads to mutual benefit."
          },
          PLAYER_BETRAY_AI_COOPERATE: {
            playerPoints: 5,
            aiPoints: 0,
            dmPoints: 2,
            narrative: "Your betrayal catches them completely off guard."
          },
          PLAYER_COOPERATE_AI_BETRAY: {
            playerPoints: 0,
            aiPoints: 5,
            dmPoints: 2,
            narrative: "Your trust is expertly exploited."
          },
          PLAYER_NEGOTIATE_AI_COOPERATE: {
            playerPoints: 3,
            aiPoints: 2,
            dmPoints: 1,
            narrative: "Your caution meets their openness with mixed results."
          },
          PLAYER_COOPERATE_AI_NEGOTIATE: {
            playerPoints: 2,
            aiPoints: 3,
            dmPoints: 1,
            narrative: "Your transparency is met with calculated reserve."
          },
          PLAYER_BETRAY_AI_NEGOTIATE: {
            playerPoints: 4,
            aiPoints: 1,
            dmPoints: 2,
            narrative: "Your betrayal partially succeeds against their caution."
          },
          PLAYER_NEGOTIATE_AI_BETRAY: {
            playerPoints: 1,
            aiPoints: 4,
            dmPoints: 2,
            narrative: "Your caution minimizes the impact of their betrayal."
          }
        },
      
        defaultScene: {
          id: 'default-tension',
          title: 'Rising Stakes',
          description: 'The situation grows more complex as new developments unfold.',
          narration: [
            "Interesting choices bring us to an... unexpected position.",
            "Shall we see how this plays out?"
          ],
          skillCheck: { name: 'Deception', dcCheck: 12 }
        }
      }