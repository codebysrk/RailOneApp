import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, ImageBackground } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Rect, Stop } from 'react-native-svg';
import { colors } from '../../../theme/colors';
import { spacing, radius, elevation } from '../../../theme/spacing';
import { FirebaseService } from '../../../services';
import { useAuth } from '../../../context/AuthContext';
import { APP_OFFERINGS as offerings, APP_FACTS as facts } from '../../../constants';
import {
  SearchTrainsIcon,
  PNRStatusIcon,
  CoachPositionIcon,
  TrackYourTrainIcon,
  OrderFoodIcon,
  FileRefundIcon,
  RailMadadIcon,
  GoToWavesIcon,
} from '../components/OfferingIcons';

const { width } = Dimensions.get('window');

export const HomeScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [upcomingList, setUpcomingList] = useState<any[]>([]);

  useEffect(() => {
    if (!user?.uid) return;
    // Real-time listener — only upcoming tickets
    const unsubscribe = FirebaseService.listenToTickets(user.uid, (snapshot: any) => {
      const tickets: any[] = [];
      snapshot.forEach((doc: any) => {
        const data = { id: doc.id, ...doc.data() };
        if (data.status === 'upcoming') tickets.push(data);
      });
      setUpcomingList(tickets);
    });
    return () => unsubscribe();
  }, [user?.uid]);

  const renderOfferingIcon = (type: string, color: string) => {
    switch (type) {
      case 'search':
        return <SearchTrainsIcon color={color} size={32} />;
      case 'pnr':
        return <PNRStatusIcon color={color} size={32} />;
      case 'coach':
        return <CoachPositionIcon color={color} size={32} />;
      case 'track':
        return <TrackYourTrainIcon color={color} size={32} />;
      case 'food':
        return <OrderFoodIcon color={color} size={32} />;
      case 'refund':
        return <FileRefundIcon color={color} size={32} />;
      case 'madad':
        return <RailMadadIcon color={color} size={32} />;
      case 'waves':
        return <GoToWavesIcon color={color} size={32} />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIconCircle}>
          <Text style={styles.langTextTop}>A</Text>
          <Text style={styles.langTextBottom}>अ</Text>
        </TouchableOpacity>
        
        <Image 
          source={require('../../../../assets/images/brand-logo.webp')} 
          style={styles.logo} 
          resizeMode="contain" 
        />
        
        <TouchableOpacity 
          style={[styles.headerIconCircle, { borderColor: '#e2e8f0' }]}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Notification')}
        >
          <Ionicons name="notifications-outline" size={20} color={colors.textLight} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        <Text style={styles.greeting}>
          Hi, {user?.name ? user.name.split(' ')[0] : 'User'}!
        </Text>
        
        <Text style={styles.sectionTitle}>Journey Planner</Text>
        <View style={styles.journeyPlanner}>
          <TouchableOpacity style={styles.jpItem} activeOpacity={0.8}>
            <View style={styles.jpImageWrapper}>
              <Image source={require('../../../../assets/images/one.webp')} style={styles.jpImage} resizeMode="cover" />
            </View>
            <Text style={styles.jpText}>Reserved</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.jpItem} activeOpacity={0.8} onPress={() => navigation.navigate('Unreserved')}>
            <View style={styles.jpImageWrapper}>
              <Image source={require('../../../../assets/images/two.webp')} style={styles.jpImage} resizeMode="cover" />
            </View>
            <Text style={styles.jpText}>Unreserved</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.jpItem} activeOpacity={0.8}>
            <View style={styles.jpImageWrapper}>
              <Image source={require('../../../../assets/images/three.webp')} style={styles.jpImage} resizeMode="cover" />
            </View>
            <Text style={styles.jpText}>Platform</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>More Offerings</Text>
        <View style={styles.grid}>
          {offerings.map((item) => (
            <TouchableOpacity key={item.id} style={styles.gridItem} activeOpacity={0.75}>
              <View style={[styles.iconWrapper, { backgroundColor: item.bg }]}>
                {renderOfferingIcon(item.type, item.color)}
              </View>
              <Text style={styles.gridTitle}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {upcomingList.length > 0 && (
          <View style={{ marginBottom: spacing.lg }}>
            <Text style={styles.sectionTitle}>Upcoming Journey</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.upcomingScroll}>
              {upcomingList.map((journey, idx) => {
                const trainNum = journey.train ? journey.train.split(' ')[0] : '12279';
                const gradId = `ticketGrad-${journey.id}-${idx}`;
                return (
                  <TouchableOpacity 
                    key={`journey-${journey.id}-${idx}`}
                    style={styles.upcomingCardWrapper}
                    activeOpacity={0.9}
                    onPress={() => navigation.navigate('Ticket', { ticket: journey })}
                  >
                    {/* SVG Gradient Background */}
                    <Svg height="100%" width="100%" style={StyleSheet.absoluteFill}>
                      <Defs>
                        <SvgLinearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                          <Stop offset="0%" stopColor="#3b2d71" />
                          <Stop offset="25%" stopColor="#543b8c" />
                          <Stop offset="50%" stopColor="#754da7" />
                          <Stop offset="75%" stopColor="#935ec2" />
                          <Stop offset="100%" stopColor="#aa6ccf" />
                        </SvgLinearGradient>
                      </Defs>
                      <Rect width="100%" height="100%" fill={`url(#${gradId})`} rx={24} ry={24} />
                    </Svg>

                    <View style={styles.upcomingCardInner}>
                      {/* Top Semicircle Cutout */}
                      <View style={[styles.cardNotch, styles.cardNotchTop]} />

                      {/* Top Row: Date & Train Number + Icon */}
                      <View style={styles.upcomingCardTop}>
                        <Text style={styles.upcomingDate}>{journey.date || 'Sat, 29 Aug 26'}</Text>
                        <View style={styles.trainNumBadge}>
                          <Ionicons name="ticket" size={20} color="#a8f3b0" style={styles.ticketIconStyle} />
                          <Text style={styles.trainNumText}>{trainNum}</Text>
                        </View>
                      </View>

                      <View style={styles.cardDivider} />

                      {/* Middle Row: Stations */}
                      <View style={styles.upcomingRouteRow}>
                        <Text style={styles.upcomingStationLeft}>{journey.source || 'MORENA'}</Text>
                        <Text style={styles.upcomingStationRight}>{journey.dest || 'HAZRAT NIZAMUDDIN JN'}</Text>
                      </View>

                      <View style={styles.cardDivider} />

                      {/* Bottom Row: Reserved Badge & Pill Action Buttons */}
                      <View style={styles.upcomingCardBottom}>
                        <Text style={styles.reservedBadgeText}>Reserved</Text>
                        <View style={styles.upcomingBtnsRow}>
                          <TouchableOpacity 
                            style={styles.cardBtnPill}
                            onPress={() => navigation.navigate('Unreserved')}
                          >
                            <Text style={styles.cardBtnText}>Book Again</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={styles.cardBtnPill}
                            onPress={() => navigation.navigate('Ticket', { ticket: journey })}
                          >
                            <Text style={styles.cardBtnText}>View Details</Text>
                          </TouchableOpacity>
                        </View>
                      </View>

                      {/* Bottom Semicircle Cutout */}
                      <View style={[styles.cardNotch, styles.cardNotchBottom]} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        <Text style={styles.sectionTitle}>Do You know?</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.factsContainer}>
          {facts.map(fact => (
            <View key={fact.id} style={styles.factCard}>
              <Image source={fact.img} style={styles.factImg} resizeMode="cover" />
              <Text style={styles.factText}>{fact.text}</Text>
            </View>
          ))}
        </ScrollView>

        <Text style={styles.sectionTitle}>Follow Us On Social Media Platforms</Text>
        <View style={styles.socialSection}>
          <ImageBackground 
            source={{uri: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?q=80&w=800&auto=format&fit=crop'}} 
            style={styles.socialBanner}
            imageStyle={styles.socialBannerImg}
          >
            <View style={styles.socialOverlay} />
            <View style={styles.socialIconsRow}>
              <View style={[styles.socialIconBtn, {backgroundColor: '#000'}]}><Ionicons name="close" size={16} color="#fff" /></View>
              <View style={[styles.socialIconBtn, {backgroundColor: '#1877f2'}]}><Ionicons name="logo-facebook" size={18} color="#fff" /></View>
              <View style={[styles.socialIconBtn, {backgroundColor: '#e1306c'}]}><Ionicons name="logo-instagram" size={18} color="#fff" /></View>
              <View style={[styles.socialIconBtn, {backgroundColor: '#ff0000'}]}><Ionicons name="logo-youtube" size={18} color="#fff" /></View>
            </View>
          </ImageBackground>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: {
    height: 60, backgroundColor: colors.white, flexDirection: 'row', 
    justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md,
  },
  headerIconCircle: {
    width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#bfdbfe',
    justifyContent: 'center', alignItems: 'center', backgroundColor: colors.white
  },
  langTextTop: { fontSize: 10, fontWeight: 'bold', color: colors.brandBlue, lineHeight: 12, marginRight: 6 },
  langTextBottom: { fontSize: 12, fontWeight: 'bold', color: colors.brandBlue, lineHeight: 14, marginLeft: 6, marginTop: -4 },
  logo: { height: 32, width: 120 },
  scroll: { padding: spacing.md, paddingBottom: 40 },
  greeting: { fontSize: 16, fontWeight: '700', color: colors.textHeading, marginBottom: spacing.md },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#16274e', marginBottom: spacing.md, marginTop: spacing.lg },
  journeyPlanner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  jpItem: { width: (width - spacing.md * 2 - 24) / 3, alignItems: 'center' },
  jpImageWrapper: {
    width: (width - spacing.md * 2 - 24) / 3,
    height: ((width - spacing.md * 2 - 24) / 3) * 0.94,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#f1f5f9',
  },
  jpImage: { width: '100%', height: '100%' },
  jpText: { fontSize: 14.5, fontWeight: '500', color: '#243b6b', textAlign: 'center', marginTop: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridItem: { width: (width - spacing.md * 2 - 36) / 4, alignItems: 'center', marginBottom: spacing.md },
  iconWrapper: {
    width: (width - spacing.md * 2 - 36) / 4,
    height: (width - spacing.md * 2 - 36) / 4,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  gridTitle: { fontSize: 13, color: '#243b6b', fontWeight: '500', textAlign: 'center', lineHeight: 16.5 },
  upcomingScroll: { marginHorizontal: -spacing.md, paddingHorizontal: spacing.md },
  upcomingCardWrapper: {
    width: width * 0.82,
    borderRadius: 20,
    marginRight: 12,
    overflow: 'hidden',
    ...elevation.sm,
  },
  upcomingCardInner: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    position: 'relative',
  },
  cardNotch: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.white,
    right: 62,
  },
  cardNotchTop: { top: -12 },
  cardNotchBottom: { bottom: -12 },
  upcomingCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  upcomingDate: { color: colors.white, fontSize: 15, fontWeight: '500' },
  trainNumBadge: { alignItems: 'flex-end', justifyContent: 'center' },
  ticketIconStyle: { marginBottom: 1 },
  trainNumText: { color: colors.white, fontSize: 19, fontWeight: '700', letterSpacing: 0.5 },
  cardDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.22)', marginVertical: 7 },
  upcomingRouteRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  upcomingStationLeft: { color: colors.white, fontSize: 13.5, fontWeight: '500', letterSpacing: 0.2 },
  upcomingStationRight: { color: colors.white, fontSize: 13.5, fontWeight: '500', letterSpacing: 0.2, textAlign: 'right' },
  upcomingCardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reservedBadgeText: { color: '#a8f3b0', fontSize: 15, fontWeight: '700' },
  upcomingBtnsRow: { flexDirection: 'row', alignItems: 'center' },
  cardBtnPill: { 
    borderWidth: 1.2, 
    borderColor: colors.white, 
    borderRadius: 18, 
    paddingHorizontal: 12, 
    paddingVertical: 4.5, 
    marginLeft: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  cardBtnText: { color: colors.white, fontSize: 12, fontWeight: '500' },

  factsContainer: { flexDirection: 'row', marginHorizontal: -spacing.md, paddingHorizontal: spacing.md },
  factCard: { width: 140, marginRight: 12 },
  factImg: { width: 140, height: 110, borderRadius: 14, marginBottom: 6 },
  factText: { fontSize: 11, color: '#475569', lineHeight: 15 },
  socialSection: { height: 160, borderRadius: 16, overflow: 'hidden', marginTop: spacing.sm },
  socialBanner: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  socialBannerImg: { borderRadius: 16 },
  socialOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 16 },
  socialIconsRow: { flexDirection: 'row', zIndex: 1 },
  socialIconBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginHorizontal: 8 },
});
