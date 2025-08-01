import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Star, ShoppingBag, TrendingUp, Users } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields.",
        variant: "destructive"
      });
      return;
    }
    setLoading(true);
    const { error } = await signIn(email, password);
    if (!error) {
      toast({
        title: "Welcome back!",
        description: "Successfully logged in to your dashboard.",
      });
    }
    setLoading(false);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!email || !password || !name) {
      toast({
        title: "Error",
        description: "Please fill in all fields.",
        variant: "destructive"
      });
      return;
    }
    setLoading(true);
    const { error } = await signUp(email, password, {
      data: {
        full_name: name,
      }
    });

    if (!error) {
      toast({
        title: "Account created!",
        description: "Please check your email to verify your account.",
      });
    }
    setLoading(false);
  };

  return (
    <>
      <Helmet>
        <title>Login - ReviewFlow</title>
        <meta name="description" content="Sign in to your ReviewFlow account and start collecting Amazon reviews with ease." />
      </Helmet>
      
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
          {/* Left Side - Hero Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <div className="space-y-4">
              <motion.h1 
                className="text-5xl lg:text-6xl font-bold gradient-text"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                ReviewFlow
              </motion.h1>
              <motion.p 
                className="text-xl text-gray-300 max-w-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                Transform your Amazon business with intelligent review collection campaigns and QR code magic
              </motion.p>
            </div>

            <motion.div 
              className="grid grid-cols-2 gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div className="glass-effect rounded-xl p-4 card-hover">
                <Star className="h-8 w-8 text-yellow-400 mb-2" />
                <h3 className="font-semibold text-white">Boost Reviews</h3>
                <p className="text-sm text-gray-400">Increase positive reviews by 300%</p>
              </div>
              <div className="glass-effect rounded-xl p-4 card-hover">
                <ShoppingBag className="h-8 w-8 text-blue-400 mb-2" />
                <h3 className="font-semibold text-white">Easy Setup</h3>
                <p className="text-sm text-gray-400">Launch campaigns in minutes</p>
              </div>
              <div className="glass-effect rounded-xl p-4 card-hover">
                <TrendingUp className="h-8 w-8 text-green-400 mb-2" />
                <h3 className="font-semibold text-white">Track Growth</h3>
                <p className="text-sm text-gray-400">Real-time analytics dashboard</p>
              </div>
              <div className="glass-effect rounded-xl p-4 card-hover">
                <Users className="h-8 w-8 text-purple-400 mb-2" />
                <h3 className="font-semibold text-white">Customer Focus</h3>
                <p className="text-sm text-gray-400">Seamless user experience</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Side - Login Form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="w-full max-w-md mx-auto"
          >
            <Card className="glass-effect border-0 shadow-2xl">
              <CardHeader className="text-center space-y-2">
                <CardTitle className="text-2xl font-bold text-white">Welcome</CardTitle>
                <CardDescription className="text-gray-400">
                  Sign in to your account or create a new one
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="login" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-2 bg-gray-800/50">
                    <TabsTrigger value="login" className="data-[state=active]:bg-blue-600">Login</TabsTrigger>
                    <TabsTrigger value="signup" className="data-[state=active]:bg-blue-600">Sign Up</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="login">
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-white">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="seller@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-white">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400"
                        />
                      </div>
                      <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700" disabled={loading}>
                        {loading ? 'Signing In...' : 'Sign In'}
                      </Button>
                    </form>
                  </TabsContent>
                  
                  <TabsContent value="signup">
                    <form onSubmit={handleSignup} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-name" className="text-white">Full Name</Label>
                        <Input
                          id="signup-name"
                          type="text"
                          placeholder="John Doe"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-email" className="text-white">Email</Label>
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="seller@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password" className="text-white">Password</Label>
                        <Input
                          id="signup-password"
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400"
                        />
                      </div>
                      <Button type="submit" className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700" disabled={loading}>
                        {loading ? 'Creating Account...' : 'Create Account'}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default Login;