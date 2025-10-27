'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWallet } from '@/hooks/useWallet';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  User, 
  Settings, 
  Package, 
  ArrowRightLeft, 
  LayoutDashboard,
  Wallet,
  LogOut
} from 'lucide-react';

export function Header() {
  const pathname = usePathname();
  const { 
    isConnected, 
    account, 
    currentUser, 
    isAdmin, 
    connectWallet, 
    disconnectWallet,
    formatAddress,
    getRoleColor 
  } = useWallet();

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      show: isConnected && currentUser?.status === 'Approved'
    },
    {
      name: 'Tokens',
      href: '/tokens',
      icon: Package,
      show: isConnected && currentUser?.status === 'Approved'
    },
    {
      name: 'Transferencias',
      href: '/transfers',
      icon: ArrowRightLeft,
      show: isConnected && currentUser?.status === 'Approved'
    },
    {
      name: 'Admin',
      href: '/admin',
      icon: Settings,
      show: isConnected && isAdmin
    },
    {
      name: 'Perfil',
      href: '/profile',
      icon: User,
      show: isConnected
    }
  ];

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Package className="h-8 w-8 text-blue-600" />
            <span className="hidden lg:inline text-l font-bold text-gray-900">
              Supply Chain Tracker
            </span>
          </Link>

          {/* Navigation */}
          {isConnected && (
            <nav className="hidden md:flex items-center space-x-1">
              {navigation
                .filter(item => item.show)
                .map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || 
                    (item.href !== '/' && pathname.startsWith(item.href));
                  
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`
                        flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors
                        ${isActive 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                        }
                      `}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
            </nav>
          )}

          {/* User Section */}
          <div className="flex items-center space-x-4">
            {!isConnected ? (
              <Button onClick={connectWallet} className="flex items-center space-x-2">
                <Wallet className="h-4 w-4" />
                <span>Conectar Wallet</span>
              </Button>
            ) : (
              <div className="flex items-center space-x-3">
                {/* User Info */}
                <Card className="border-0 shadow-none">
                  <CardContent className="px-3 py-2">
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <div className="text-xs text-gray-500">
                          {formatAddress(account!)}
                        </div>
                        {isAdmin && !currentUser ? (
                          // Admin puro (sin rol de usuario)
                          <div className="flex items-center space-x-1">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                              👑 Admin
                            </span>
                          </div>
                        ) : currentUser ? (
                          // Usuario con rol
                          <div className="flex items-center space-x-1">
                            <span 
                              className={`text-xs px-2 py-0.5 rounded-full ${getRoleColor(currentUser.role)}`}
                            >
                              {currentUser.role}
                            </span>
                            {isAdmin && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                                +Admin
                              </span>
                            )}
                          </div>
                        ) : null}
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={disconnectWallet}
                        className="h-8 w-8"
                      >
                        <LogOut className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        {isConnected && (
          <div className="md:hidden border-t border-gray-200 py-2">
            <nav className="flex items-center space-x-1 overflow-x-auto">
              {navigation
                .filter(item => item.show)
                .map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || 
                    (item.href !== '/' && pathname.startsWith(item.href));
                  
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`
                        flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors
                        ${isActive 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                        }
                      `}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}