import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  useWindowDimensions,
  Platform,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type AlertType = 'info' | 'success' | 'warning' | 'error' | 'confirm';

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

export interface AlertOptions {
  title: string;
  message?: string;
  buttons?: AlertButton[];
  type?: AlertType;
  icon?: keyof typeof Ionicons.glyphMap;
}

interface AlertContextType {
  showAlert: (options: AlertOptions) => void;
  hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType>({
  showAlert: () => {},
  hideAlert: () => {},
});

// Singleton emitter so non-hook utility files can also show alerts
type AlertListener = (options: AlertOptions) => void;
let globalAlertListener: AlertListener | null = null;

export const AppAlert = {
  show: (
    title: string,
    message?: string,
    buttons?: AlertButton[],
    type?: AlertType,
    icon?: keyof typeof Ionicons.glyphMap
  ) => {
    if (globalAlertListener) {
      globalAlertListener({
        title,
        message,
        buttons: buttons || [{ text: 'OK', style: 'default' }],
        type,
        icon,
      });
    }
  },
  alert: (
    title: string,
    message?: string,
    buttons?: AlertButton[],
    options?: { type?: AlertType; icon?: keyof typeof Ionicons.glyphMap }
  ) => {
    if (globalAlertListener) {
      globalAlertListener({
        title,
        message,
        buttons: buttons || [{ text: 'OK', style: 'default' }],
        type: options?.type,
        icon: options?.icon,
      });
    }
  },
};

export const useAlert = () => useContext(AlertContext);

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { width } = useWindowDimensions();
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<AlertOptions>({ title: '' });

  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const hideAlert = useCallback(() => {
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.85,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
    });
  }, [opacityAnim, scaleAnim]);

  const showAlert = useCallback(
    (options: AlertOptions) => {
      // Auto-determine type if not explicitly set
      let resolvedType: AlertType = options.type || 'info';
      const lowerTitle = options.title.toLowerCase();

      if (!options.type) {
        if (
          lowerTitle.includes('success') ||
          lowerTitle.includes('thank you') ||
          lowerTitle.includes('done')
        ) {
          resolvedType = 'success';
        } else if (
          lowerTitle.includes('error') ||
          lowerTitle.includes('failed') ||
          lowerTitle.includes('invalid') ||
          lowerTitle.includes('limit')
        ) {
          resolvedType = 'error';
        } else if (
          lowerTitle.includes('warning') ||
          lowerTitle.includes('required') ||
          lowerTitle.includes('same station')
        ) {
          resolvedType = 'warning';
        } else if (
          lowerTitle.includes('log out') ||
          lowerTitle.includes('remove') ||
          lowerTitle.includes('delete') ||
          (options.buttons && options.buttons.length > 1)
        ) {
          resolvedType = 'confirm';
        }
      }

      setConfig({
        ...options,
        type: resolvedType,
        buttons: options.buttons || [{ text: 'OK', style: 'default' }],
      });
      setVisible(true);

      scaleAnim.setValue(0.85);
      opacityAnim.setValue(0);

      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          damping: 20,
          stiffness: 250,
          mass: 0.8,
          useNativeDriver: true,
        }),
      ]).start();
    },
    [opacityAnim, scaleAnim]
  );

  useEffect(() => {
    globalAlertListener = (opts) => showAlert(opts);
    return () => {
      globalAlertListener = null;
    };
  }, [showAlert]);

  const getBadgeDetails = () => {
    if (config.icon) {
      return {
        name: config.icon,
        bgColor: '#eff6ff',
        iconColor: '#0066ff',
      };
    }

    switch (config.type) {
      case 'success':
        return {
          name: 'checkmark-circle' as const,
          bgColor: '#ecfdf5',
          iconColor: '#10b981',
        };
      case 'error':
        return {
          name: 'alert-circle' as const,
          bgColor: '#fef2f2',
          iconColor: '#ef4444',
        };
      case 'warning':
        return {
          name: 'warning' as const,
          bgColor: '#fffbeb',
          iconColor: '#f59e0b',
        };
      case 'confirm':
        return {
          name: 'help-circle' as const,
          bgColor: '#eef2ff',
          iconColor: '#6366f1',
        };
      default:
        return {
          name: 'information-circle' as const,
          bgColor: '#eff6ff',
          iconColor: '#0066ff',
        };
    }
  };

  const badge = getBadgeDetails();
  const cardWidth = Math.min(width * 0.86, 360);

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}
      <Modal
        transparent
        visible={visible}
        animationType="none"
        statusBarTranslucent
        onRequestClose={hideAlert}
      >
        <TouchableWithoutFeedback onPress={hideAlert}>
          <Animated.View style={[styles.backdrop, { opacity: opacityAnim }]} />
        </TouchableWithoutFeedback>

        <View style={styles.modalCenter} pointerEvents="box-none">
          <Animated.View
            style={[
              styles.card,
              {
                width: cardWidth,
                opacity: opacityAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            {/* Top Icon Badge */}
            <View style={[styles.iconCircle, { backgroundColor: badge.bgColor }]}>
              <Ionicons name={badge.name} size={36} color={badge.iconColor} />
            </View>

            {/* Title */}
            <Text style={styles.title}>{config.title}</Text>

            {/* Message */}
            {config.message ? (
              <Text style={styles.message}>{config.message}</Text>
            ) : null}

            {/* Action Buttons */}
            <View
              style={[
                styles.buttonRow,
                config.buttons && config.buttons.length > 2 && styles.buttonCol,
              ]}
            >
              {config.buttons?.map((btn, idx) => {
                const isCancel = btn.style === 'cancel';
                const isDestructive = btn.style === 'destructive';

                let btnStyle: ViewStyle = styles.primaryBtn;
                let textStyle: TextStyle = styles.primaryBtnText;

                if (isCancel) {
                  btnStyle = styles.cancelBtn;
                  textStyle = styles.cancelBtnText;
                } else if (isDestructive) {
                  btnStyle = styles.destructiveBtn;
                  textStyle = styles.destructiveBtnText;
                }

                return (
                  <TouchableOpacity
                    key={`${btn.text}-${idx}`}
                    style={[
                      btnStyle,
                      config.buttons &&
                        config.buttons.length === 2 &&
                        styles.halfBtn,
                    ]}
                    activeOpacity={0.8}
                    onPress={() => {
                      hideAlert();
                      if (btn.onPress) {
                        btn.onPress();
                      }
                    }}
                  >
                    <Text style={textStyle}>{btn.text}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>
        </View>
      </Modal>
    </AlertContext.Provider>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.52)',
  },
  modalCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 20,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Montserrat_700Bold',
    color: '#0f2942',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.1,
  },
  message: {
    fontSize: 13.5,
    fontFamily: 'Montserrat_500Medium',
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
    paddingHorizontal: 6,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    gap: 10,
  },
  buttonCol: {
    flexDirection: 'column',
    gap: 8,
  },
  halfBtn: {
    flex: 1,
  },
  primaryBtn: {
    backgroundColor: '#0066ff',
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    width: '100%',
    shadowColor: '#0066ff',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontFamily: 'Montserrat_700Bold',
    letterSpacing: 0.2,
  },
  cancelBtn: {
    backgroundColor: '#f1f5f9',
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    width: '100%',
  },
  cancelBtnText: {
    color: '#64748b',
    fontSize: 15,
    fontFamily: 'Montserrat_600SemiBold',
  },
  destructiveBtn: {
    backgroundColor: '#ef4444',
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    width: '100%',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  destructiveBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontFamily: 'Montserrat_700Bold',
    letterSpacing: 0.2,
  },
});
