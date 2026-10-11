import { useEffect } from 'react';
import { useTenant } from '../context/TenantContext';
import { getEvolutionConfig } from './evolutionApi';

// ═══════════════════════════════════════════════════════════════════
// ⚠️ KILL SWITCH ACTIVADO — Sesión Fix Bloque Extendido (2026-10-11)
// ═══════════════════════════════════════════════════════════════════
// El contenedor Evolution API está crasheando por un problema de
// configuración de nginx (`must-revalidate` inválido). Por lo tanto,
// el endpoint `/socket.io/` NO existe y cualquier intento de conexión
// genera un bucle infinito de errores WebSocket en el navegador.
//
// Solución temporal: deshabilitar la conexión automática a Socket.io
// hasta que Evolution API esté estable. La pantalla sigue funcionando
// con los botones manuales ("Verificar Conexión" y "Generar QR").
//
// Cuando Evolution API esté estable:
//   1. Cambiar SOCKET_IO_ENABLED a true.
//   2. Reiniciar Vite.
// ═══════════════════════════════════════════════════════════════════
const SOCKET_IO_ENABLED = false;

// Types for Evolution API events
interface ConnectionUpdateEvent {
  instance: string;
  connectionStatus: 'open' | 'connecting' | 'close' | 'disconnected' | 'logged_out' | 'timeout' | 'authentication_failed';
  lastDisconnect?: { reason: string; error?: any };
  qrCode?: string;
  timestamp: number;
}

interface QrCodeEvent {
  instance: string;
  qrCode: string;
  timestamp: number;
}

interface CredsUpdateEvent {
  instance: string;
  creds: any;
  timestamp: number;
}

type SocketEventHandler = (data: any) => void;

class WhatsAppSocketService {
  private static instance: WhatsAppSocketService;
  private socket: any = null;
  private eventHandlers: Map<string, Set<SocketEventHandler>> = new Map();
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private ioLibrary: any = null;
  private warnedDisabled = false;

  private constructor() {
    const config = getEvolutionConfig();
    this.apiUrl = config.apiUrl;
    this.apiKey = config.apiKey;
  }

  public static getInstance(): WhatsAppSocketService {
    if (!WhatsAppSocketService.instance) {
      WhatsAppSocketService.instance = new WhatsAppSocketService();
    }
    return WhatsAppSocketService.instance;
  }

  /**
   * Load socket.io-client library dynamically
   */
  private loadSocketLibrary(): Promise<any> {
    return new Promise((resolve) => {
      if (typeof (window as any).io !== 'undefined') {
        resolve((window as any).io);
        return;
      }
      import('socket.io-client')
        .then((module) => resolve(module.io || module.default))
        .catch(() => resolve(null));
    });
  }

  /**
   * Connect to Evolution API Socket.io server.
   * ⚠️ DESHABILITADO por kill switch (SOCKET_IO_ENABLED = false).
   */
  public async connect(): Promise<void> {
    if (!SOCKET_IO_ENABLED) {
      if (!this.warnedDisabled) {
        console.info(
          '[KILL SWITCH] whatsappSocketService.connect() deshabilitado. ' +
          'Evolution API no está estable. La pantalla funciona con polling manual.'
        );
        this.warnedDisabled = true;
      }
      return;
    }

    if (this.socket) return;

    try {
      const io = await this.loadSocketLibrary();
      if (!io) {
        console.warn('Socket.io client not available, using polling fallback for WhatsApp state updates');
        return;
      }

      this.socket = io(this.apiUrl, {
        transports: ['websocket'],
        auth: {
          apikey: this.apiKey
        },
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000
      });

      this.socket.on('connect', () => {
        console.log('✅ Conectado a Evolution API Socket.io');
      });

      this.socket.on('disconnect', (reason: string) => {
        console.log(`❌ Desconectado de Evolution API Socket.io: ${reason}`);
      });

      this.socket.on('connect_error', (error: any) => {
        console.error('❌ Error de conexión Socket.io:', error);
      });

      this.socket.on('connection.update', (data: ConnectionUpdateEvent) => {
        this.emitEvent('connection.update', data);
        console.log('📡 Evento connection.update recibido:', data);
      });

      this.socket.on('qrcode', (data: QrCodeEvent) => {
        this.emitEvent('qrcode', data);
        console.log('📡 Evento qrcode recibido');
      });

      this.socket.on('creds.update', (data: CredsUpdateEvent) => {
        this.emitEvent('creds.update', data);
        console.log('📡 Evento creds.update recibido');
      });

    } catch (error) {
      console.error('Error initializing Socket.io client:', error);
    }
  }

  /**
   * Disconnect from Socket.io server
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.eventHandlers.clear();
  }

  /**
   * Subscribe to a specific event
   */
  public on(event: string, handler: SocketEventHandler): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    const handlers = this.eventHandlers.get(event)!;
    handlers.add(handler);

    // Ensure socket is connected (no-op si kill switch está activo)
    if (!this.socket) {
      this.connect();
    }

    return () => {
      const handlers = this.eventHandlers.get(event);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.eventHandlers.delete(event);
        }
      }
    };
  }

  /**
   * Emit event to listeners
   */
  private emitEvent(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }

  /**
   * Check if socket is connected
   */
  public isConnected(): boolean {
    return this.socket !== null && this.socket.connected;
  }

  /**
   * Check if socket is available
   */
  public isSocketAvailable(): boolean {
    return this.ioLibrary !== null || typeof (window as any).io !== 'undefined';
  }
}

// Singleton instance
const socketService = WhatsAppSocketService.getInstance();

// Hook para usar el servicio de sockets en componentes
export const useWhatsAppSocket = () => {
  const { currentTenant } = useTenant();

  useEffect(() => {
    // ⚠️ Kill switch: no conectar automáticamente.
    // Cambiar SOCKET_IO_ENABLED a true cuando Evolution API esté estable.
    socketService.connect();

    return () => {
      // Mantener conexión activa para otros componentes
    };
  }, [currentTenant.id]);

  return socketService;
};

export default socketService;