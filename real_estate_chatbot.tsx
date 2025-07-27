import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, MessageCircle, Home, AlertTriangle, FileText, Send, Bot, User, Settings, MapPin, Clock, CheckCircle } from 'lucide-react';

const RealEstateChatbot = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeAgent, setActiveAgent] = useState(null);
  const [userLocation, setUserLocation] = useState('');
  const [conversationContext, setConversationContext] = useState([]);
  const [agentConfidence, setAgentConfidence] = useState(0);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Enhanced Agent System
  const agents = {
    router: {
      name: 'Route Manager',
      icon: Settings,
      color: 'text-purple-600',
      description: 'Determines the best agent for your query'
    },
    agent1: {
      name: 'Property Inspector',
      icon: AlertTriangle,
      color: 'text-orange-600',
      description: 'Specializes in property issues, damage assessment, and maintenance'
    },
    agent2: {
      name: 'Tenancy Expert',
      icon: FileText,
      color: 'text-blue-600',
      description: 'Expert in rental laws, tenant rights, and lease agreements'
    },
    clarification: {
      name: 'Assistant',
      icon: MessageCircle,
      color: 'text-green-600',
      description: 'Helps clarify your needs'
    }
  };

  // Advanced routing with confidence scoring
  const routeToAgent = async (text, hasImage, context = []) => {
    const faqKeywords = {
      strong: ['evict', 'eviction', 'deposit', 'lease', 'landlord', 'tenant', 'rent increase', 'notice period', 'tenancy law', 'rental agreement'],
      medium: ['contract', 'legal', 'rights', 'law', 'agreement', 'rental', 'vacancy', 'subletting'],
      weak: ['rent', 'payment', 'move out', 'move in']
    };
    
    const issueKeywords = {
      strong: ['damage', 'broken', 'crack', 'leak', 'mold', 'mould', 'water damage', 'structural', 'electrical', 'plumbing'],
      medium: ['repair', 'fix', 'problem', 'issue', 'maintenance', 'paint', 'wall', 'ceiling', 'floor'],
      weak: ['lighting', 'fixture', 'door', 'window', 'heating', 'cooling']
    };

    // Image uploads always go to Agent 1
    if (hasImage) {
      setAgentConfidence(95);
      return 'agent1';
    }

    const textLower = text.toLowerCase();
    
    // Calculate confidence scores
    let faqScore = 0;
    let issueScore = 0;

    // Strong keywords get higher weight
    faqScore += faqKeywords.strong.filter(keyword => textLower.includes(keyword)).length * 3;
    faqScore += faqKeywords.medium.filter(keyword => textLower.includes(keyword)).length * 2;
    faqScore += faqKeywords.weak.filter(keyword => textLower.includes(keyword)).length * 1;

    issueScore += issueKeywords.strong.filter(keyword => textLower.includes(keyword)).length * 3;
    issueScore += issueKeywords.medium.filter(keyword => textLower.includes(keyword)).length * 2;
    issueScore += issueKeywords.weak.filter(keyword => textLower.includes(keyword)).length * 1;

    // Context awareness - check previous messages
    const recentContext = context.slice(-3);
    for (const msg of recentContext) {
      if (msg.agent === 'agent1') issueScore += 1;
      if (msg.agent === 'agent2') faqScore += 1;
    }

    const totalScore = faqScore + issueScore;
    const confidence = Math.min((Math.max(faqScore, issueScore) / Math.max(totalScore, 1)) * 100, 95);
    setAgentConfidence(confidence);

    if (faqScore > issueScore && faqScore > 0) {
      return 'agent2';
    } else if (issueScore > faqScore && issueScore > 0) {
      return 'agent1';
    } else if (totalScore === 0) {
      return 'clarification';
    } else {
      return 'router';
    }
  };

  // Enhanced Agent 1: Property Inspector with advanced analysis
  const agent1Response = async (text, imageData = null, context = []) => {
    const contextHistory = context.map(msg => `${msg.type}: ${msg.content}`).join('\n');
    
    const prompt = `You are an expert Property Inspector with 15+ years of experience in property assessment, damage evaluation, and maintenance troubleshooting.

CONVERSATION CONTEXT:
${contextHistory}

CURRENT REQUEST: "${text}"
${imageData ? 'IMAGE PROVIDED: Analyze the uploaded image thoroughly' : 'NO IMAGE: Work with text description only'}

ANALYSIS FRAMEWORK:
1. ISSUE IDENTIFICATION
   - Primary problem(s)
   - Secondary concerns
   - Severity level (Low/Medium/High/Critical)

2. ROOT CAUSE ANALYSIS
   - Most likely causes
   - Contributing factors
   - Timeline assessment

3. IMMEDIATE ACTIONS
   - Safety concerns (if any)
   - Temporary solutions
   - Prevention of further damage

4. PROFESSIONAL RECOMMENDATIONS
   - DIY feasibility
   - When to call professionals
   - Estimated urgency (hours/days/weeks)
   - Rough cost implications

5. FOLLOW-UP QUESTIONS
   - Ask 1-2 specific questions to better diagnose

RESPONSE FORMAT:
🔍 **Issue Assessment:** [Clear identification]
⚠️ **Severity:** [Level with brief justification]
🔧 **Immediate Steps:** [What to do now]
👨‍🔧 **Professional Help:** [When and who to call]
❓ **Need to Know:** [Follow-up questions]

Be specific, practical, and prioritize safety. Use technical terms when necessary but explain them clearly.`;

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1200,
          messages: [
            {
              role: "user",
              content: imageData ? [
                {
                  type: "image",
                  source: {
                    type: "base64",
                    media_type: "image/jpeg",
                    data: imageData
                  }
                },
                {
                  type: "text",
                  text: prompt
                }
              ] : [
                {
                  type: "text",
                  text: prompt
                }
              ]
            }
          ]
        })
      });

      const data = await response.json();
      return data.content[0].text;
    } catch (error) {
      return `🔧 **Property Inspector Error**

I'm experiencing technical difficulties right now. However, I can offer some general guidance:

If this is a **safety issue** (gas leaks, electrical problems, structural damage):
- Contact professionals immediately
- Evacuate if necessary
- Document with photos

For **non-urgent issues**:
- Take detailed photos
- Note when the problem started
- Check if it affects daily living

Could you describe the issue in more detail so I can provide better guidance even without full system access?`;
    }
  };

  // Enhanced Agent 2: Tenancy Expert with location awareness
  const agent2Response = async (text, context = [], location = '') => {
    const contextHistory = context.map(msg => `${msg.type}: ${msg.content}`).join('\n');
    
    const prompt = `You are a Tenancy Law Expert with comprehensive knowledge of rental regulations, tenant rights, and landlord obligations across different jurisdictions.

CONVERSATION CONTEXT:
${contextHistory}

USER LOCATION: ${location || 'Not specified - provide general guidance'}
CURRENT QUESTION: "${text}"

ANALYSIS FRAMEWORK:
1. LEGAL OVERVIEW
   - Core legal principles
   - General tenant/landlord rights
   - Common misconceptions

2. LOCATION-SPECIFIC GUIDANCE
   ${location ? `- Specific laws for ${location}` : '- Request location for specific advice'}
   - Key variations from general law
   - Important local resources

3. PRACTICAL STEPS
   - Immediate actions to take
   - Documentation needed
   - Timeline considerations

4. ESCALATION PATH
   - When to seek legal help
   - Relevant authorities/agencies
   - Cost considerations

5. PREVENTION/BEST PRACTICES
   - How to avoid similar issues
   - Record keeping tips

RESPONSE FORMAT:
⚖️ **Legal Overview:** [Core rights and obligations]
📍 **Location Notes:** [Specific guidance or request for location]
📋 **Action Steps:** [What to do now]
🏛️ **Official Resources:** [Who to contact if needed]
💡 **Pro Tips:** [Prevention and best practices]

${!location ? '\n**Note:** For location-specific advice, please share your city/state/country.' : ''}

Be accurate, practical, and emphasize the importance of verifying local laws. Always recommend professional legal advice for complex situations.`;

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1200,
          messages: [
            {
              role: "user",
              content: prompt
            }
          ]
        })
      });

      const data = await response.json();
      return data.content[0].text;
    } catch (error) {
      return `⚖️ **Tenancy Expert Error**

I'm having technical difficulties, but here's some general guidance:

**For immediate tenancy issues:**
- Document everything in writing
- Keep all communication records
- Know your local tenant rights organization
- Check your lease agreement first

**Common resources:**
- Local housing authority
- Tenant rights organizations
- Legal aid societies
- Small claims court (for deposits)

**${text.toLowerCase().includes('evict') ? 'EVICTION NOTICE RECEIVED?' : ''}**
${text.toLowerCase().includes('evict') ? '- Don\'t ignore it\n- Seek immediate legal help\n- Know your response timeline' : ''}

Could you rephrase your question? I'll do my best to help with the information I can access.`;
    }
  };

  // Router response for complex routing decisions
  const routerResponse = async (text, context = []) => {
    const prompt = `You are an intelligent routing assistant for a real estate chatbot system. 

AVAILABLE AGENTS:
1. Property Inspector - Property issues, damage, maintenance, repairs
2. Tenancy Expert - Rental laws, tenant rights, lease questions, landlord issues

USER QUERY: "${text}"
CONTEXT: ${context.map(msg => msg.content).slice(-2).join(' | ')}

Analyze this query and:
1. Determine which agent would be most helpful
2. Explain why
3. Ask any clarifying questions needed
4. Provide a brief preview of what that agent can help with

Be helpful and guide the user to the right specialist.`;

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 600,
          messages: [
            {
              role: "user",
              content: prompt
            }
          ]
        })
      });

      const data = await response.json();
      return data.content[0].text;
    } catch (error) {
      return clarificationResponse();
    }
  };

  // Clarification response for unclear queries
  const clarificationResponse = () => {
    return `🤔 **I'm here to help, but need a bit more information!**

I specialize in two main areas:

🔧 **Property Issues & Maintenance**
- Damage assessment (water, structural, electrical)
- Repair recommendations and troubleshooting
- Safety concerns and urgent fixes
- Upload photos for detailed analysis

📋 **Tenancy & Rental Law**
- Lease agreements and tenant rights
- Landlord responsibilities and disputes
- Eviction notices and deposit issues
- Location-specific rental law guidance

**To get the best help:**
- Be specific about your situation
- Upload photos if it's a physical problem
- Mention your location for legal questions
- Let me know if it's urgent

What's your specific question or concern?`;
  };

  const getImageBase64 = (dataUrl) => {
    return dataUrl.split(',')[1];
  };

  const sendMessage = async () => {
    if (!inputText.trim() && !selectedImage) return;

    const userMessage = {
      type: 'user',
      content: inputText || 'Image uploaded for analysis',
      image: selectedImage,
      timestamp: new Date().toLocaleTimeString(),
      agent: 'user'
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setConversationContext(newMessages);
    setIsLoading(true);

    try {
      const agent = await routeToAgent(inputText, !!selectedImage, conversationContext);
      setActiveAgent(agent);

      let response;
      if (agent === 'agent1') {
        const imageData = selectedImage ? getImageBase64(selectedImage) : null;
        response = await agent1Response(inputText, imageData, conversationContext);
      } else if (agent === 'agent2') {
        response = await agent2Response(inputText, conversationContext, userLocation);
      } else if (agent === 'router') {
        response = await routerResponse(inputText, conversationContext);
      } else {
        response = clarificationResponse();
      }

      const botMessage = {
        type: 'bot',
        content: response,
        agent: agent,
        timestamp: new Date().toLocaleTimeString(),
        confidence: agentConfidence
      };

      const finalMessages = [...newMessages, botMessage];
      setMessages(finalMessages);
      setConversationContext(finalMessages);
    } catch (error) {
      const errorMessage = {
        type: 'bot',
        content: 'I apologize, but I encountered a technical issue. Please try rephrasing your question or check your internet connection.',
        agent: 'error',
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, errorMessage]);
    }

    setInputText('');
    setSelectedImage(null);
    setIsLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getAgentInfo = (agentId) => {
    return agents[agentId] || agents.clarification;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Enhanced Header */}
      <div className="bg-white shadow-lg border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-3 rounded-xl">
                <Home className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Multi-Agent Real Estate Assistant</h1>
                <p className="text-gray-600">Advanced Property & Tenancy Support System</p>
              </div>
            </div>
            
            {/* Location Input */}
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Your location (for legal advice)"
                value={userLocation}
                onChange={(e) => setUserLocation(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Agent Status Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Agent Status</h3>
              
              {/* Active Agent */}
              {activeAgent && (
                <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Active Agent</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {React.createElement(getAgentInfo(activeAgent).icon, { 
                      className: `w-5 h-5 ${getAgentInfo(activeAgent).color}` 
                    })}
                    <div>
                      <p className="font-medium text-gray-900">{getAgentInfo(activeAgent).name}</p>
                      <p className="text-xs text-gray-600">{getAgentInfo(activeAgent).description}</p>
                    </div>
                  </div>
                  {agentConfidence > 0 && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                        <span>Confidence</span>
                        <span>{agentConfidence.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${agentConfidence}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Available Agents */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700">Available Specialists</h4>
                {Object.entries(agents).slice(1, 3).map(([id, agent]) => {
                  const AgentIcon = agent.icon;
                  return (
                    <div key={id} className="flex items-start space-x-3 p-2 rounded-lg hover:bg-gray-50">
                      <AgentIcon className={`w-5 h-5 ${agent.color} mt-0.5`} />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{agent.name}</p>
                        <p className="text-xs text-gray-600">{agent.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Message Count */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>{messages.length} messages in conversation</span>
                </div>
              </div>
            </div>
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              {/* Messages Area */}
              <div className="h-96 overflow-y-auto p-6 space-y-4">
                {messages.length === 0 && (
                  <div className="text-center py-12">
                    <div className="bg-gradient-to-r from-blue-100 to-indigo-100 rounded-2xl p-8">
                      <Bot className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Welcome to Your Multi-Agent Assistant!</h3>
                      <p className="text-gray-600 mb-6">I'm equipped with specialized agents to handle all your real estate needs.</p>
                      
                      <div className="grid md:grid-cols-2 gap-4 text-left">
                        <div className="bg-white p-4 rounded-xl border border-orange-200">
                          <div className="flex items-center space-x-2 mb-3">
                            <AlertTriangle className="w-6 h-6 text-orange-600" />
                            <h4 className="font-semibold text-gray-900">Property Inspector</h4>
                          </div>
                          <ul className="text-sm text-gray-600 space-y-1">
                            <li>• Upload photos for damage analysis</li>
                            <li>• Get repair recommendations</li>
                            <li>• Safety issue assessment</li>
                            <li>• Maintenance troubleshooting</li>
                          </ul>
                        </div>
                        
                        <div className="bg-white p-4 rounded-xl border border-blue-200">
                          <div className="flex items-center space-x-2 mb-3">
                            <FileText className="w-6 h-6 text-blue-600" />
                            <h4 className="font-semibold text-gray-900">Tenancy Expert</h4>
                          </div>
                          <ul className="text-sm text-gray-600 space-y-1">
                            <li>• Rental law guidance</li>
                            <li>• Lease agreement help</li>
                            <li>• Tenant rights protection</li>
                            <li>• Dispute resolution advice</li>
                          </ul>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-500 mt-4">
                        💡 Tip: Set your location above for personalized legal advice
                      </p>
                    </div>
                  </div>
                )}

                {messages.map((message, index) => {
                  const agentInfo = getAgentInfo(message.agent);
                  const AgentIcon = agentInfo.icon;
                  
                  return (
                    <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-md lg:max-w-2xl ${
                        message.type === 'user' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-100 text-gray-900'
                      } rounded-2xl px-4 py-3`}>
                        {message.type === 'bot' && (
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <AgentIcon className={`w-4 h-4 ${agentInfo.color}`} />
                              <span className="text-xs font-medium text-gray-600">{agentInfo.name}</span>
                            </div>
                            {message.confidence > 0 && (
                              <span className="text-xs text-gray-500">
                                {message.confidence.toFixed(0)}% confident
                              </span>
                            )}
                          </div>
                        )}
                        {message.image && (
                          <img src={message.image} alt="Uploaded" className="w-full rounded-lg mb-3 max-w-xs" />
                        )}
                        <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                        <div className={`text-xs mt-2 ${message.type === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                          {message.timestamp}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-2xl px-4 py-3 max-w-md">
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                        <span className="text-sm text-gray-600">
                          {activeAgent === 'agent1' ? 'Property Inspector analyzing...' : 
                           activeAgent === 'agent2' ? 'Tenancy Expert researching...' : 
                           'Processing your request...'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Enhanced Input Area */}
              <div className="border-t bg-gray-50 p-4">
                {selectedImage && (
                  <div className="mb-3 p-3 bg-white rounded-lg border border-dashed border-gray-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <img src={selectedImage} alt="Selected" className="w-16 h-16 object-cover rounded-lg" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Image ready for analysis</p>
                          <p className="text-xs text-gray-600">Property Inspector will analyze this image</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setSelectedImage(null)}
                        className="text-red-500 hover:text-red-700 px-3 py-1 rounded-lg hover:bg-red-50"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
                
                <div className="flex items-end space-x-3">
                  <div className="flex-1">
                    <textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Describe your property issue, ask about tenant rights, or upload an image for analysis..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows="3"
                    />
                  </div>
                  
                  <div className="flex flex-col space-y-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (e) => setSelectedImage(e.target.result);
                          reader.readAsDataURL(file);
                        }
                      }}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-gray-200 hover:bg-gray-300 p-3 rounded-xl transition-colors"
                      title="Upload Property Image"
                    >
                      <Camera className="w-5 h-5 text-gray-600" />
                    </button>
                    
                    <button
                      onClick={sendMessage}
                      disabled={isLoading || (!inputText.trim() && !selectedImage)}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 p-3 rounded-xl transition-colors"
                      title="Send Message"
                    >
                      <Send className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                  <span>Press Enter to send • Shift + Enter for new line</span>
                  <span>{inputText.length}/1000 characters</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealEstateChatbot;