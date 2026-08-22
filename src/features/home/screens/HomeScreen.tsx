import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, ImageBackground } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../../theme/colors';
import { spacing, radius, elevation } from '../../../theme/spacing';
import { FirebaseService } from '../../../services/FirebaseService';
import { useAuth } from '../../../context/AuthContext';

const { width } = Dimensions.get('window');

const offerings = [
  { id: '1', title: 'Search\nTrains', icon: 'search', bg: '#ffe4ed', color: '#ff66a3' },
  { id: '2', title: 'PNR\nStatus', icon: 'ticket', bg: '#e0ffe0', color: '#22a042' },
  { id: '3', title: 'Coach\nPosition', icon: 'train', bg: '#e0f2fe', color: '#2563eb' },
  { id: '4', title: 'Track Your\nTrain', icon: 'location', bg: '#fffbeb', color: '#d97706' },
  { id: '5', title: 'Order\nFood', icon: 'fast-food', bg: '#e0e7ff', color: '#4f46e5' },
  { id: '6', title: 'File\nRefund', icon: 'cash', bg: '#f1f5f9', color: '#475569' },
  { id: '7', title: 'Rail\nMadad', icon: 'help-buoy', bg: '#ffe4e6', color: '#e11d48' },
  { id: '8', title: 'Go To\nWAVES', icon: 'radio', bg: '#64748b', color: colors.white },
];

const facts = [
  { id: '1', img: require('../../../../assets/images/old-train.webp'), text: 'First ever passenger train was run between Bori Bandar to Thane on April 16, 1853.' },
  { id: '2', img: require('../../../../assets/images/chenab-bridge.webp'), text: 'Chenab Railway Bridge in Dharot, Jammu & Kashmir is the World\'s highest Railway Bridge.' },
  { id: '3', img: require('../../../../assets/images/high-bridge.webp'), text: 'Noney Bridge is going to be world\'s tallest railway bridge pier at a height of 141 meters.' },
  { id: '4', img: require('../../../../assets/images/electrified.webp'), text: 'Indian Railways is on track to achieve 100% electrification of Broad Gauge network.' },
  { id: '5', img: require('../../../../assets/images/rail-platform.webp'), text: 'Gorakhpur Railway Station in Uttar Pradesh has one of the world\'s longest platforms at 1,366 meters.' },
];

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
        
        <TouchableOpacity style={[styles.headerIconCircle, { borderColor: '#e2e8f0' }]}>
          <Ionicons name="notifications-outline" size={20} color={colors.textLight} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        <Text style={styles.greeting}>
          Hi, {user?.name ? user.name.split(' ')[0] : 'User'}!
        </Text>
        
        <Text style={styles.sectionTitle}>Journey Planner</Text>
        <View style={styles.journeyPlanner}>
          <TouchableOpacity style={styles.jpCard}>
            <Image source={require('../../../../assets/images/one.webp')} style={styles.jpImage} resizeMode="cover" />
            <Text style={styles.jpText}>Reserved</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.jpCard} onPress={() => navigation.navigate('Unreserved')}>
            <Image source={require('../../../../assets/images/two.webp')} style={styles.jpImage} resizeMode="cover" />
            <Text style={styles.jpText}>Unreserved</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.jpCard}>
            <Image source={require('../../../../assets/images/three.webp')} style={styles.jpImage} resizeMode="cover" />
            <Text style={styles.jpText}>Platform</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>More Offerings</Text>
        <View style={styles.grid}>
          {offerings.map(item => (
            <TouchableOpacity key={item.id} style={styles.gridItem} activeOpacity={0.7}>
              <View style={[styles.iconWrapper, { backgroundColor: item.bg }]}>
                <Ionicons name={item.icon as any} size={28} color={item.color} />
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
                return (
                  <TouchableOpacity 
                    key={`journey-${journey.id}-${idx}`}
                    style={styles.upcomingCardWrapper}
                    activeOpacity={0.9}
                    onPress={() => navigation.navigate('Ticket', { ticket: journey })}
                  >
                    <LinearGradient
                      colors={['#3b2d71', '#543b8c', '#754da7', '#935ec2', '#aa6ccf']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.upcomingCardGradient}
                    >
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
                    </LinearGradient>
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
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.textHeading, marginBottom: spacing.md, marginTop: spacing.lg },
  journeyPlanner: { flexDirection: 'row', justifyContent: 'space-between' },
  jpCard: {
    width: (width - spacing.md * 2 - spacing.sm * 2) / 3,
    backgroundColor: colors.white, borderRadius: 16, overflow: 'hidden', ...elevation.sm, paddingBottom: spacing.sm, borderWidth: 1, borderColor: '#f1f5f9'
  },
  jpImage: { width: '100%', height: 70, backgroundColor: '#f8fafc' },
  jpText: { fontSize: 13, fontWeight: '500', color: colors.textMain, textAlign: 'center', marginTop: spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridItem: { width: (width - spacing.md * 2) / 4, alignItems: 'center', marginBottom: spacing.lg },
  iconWrapper: { width: 65, height: 65, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm },
  gridTitle: { fontSize: 12, color: colors.textHeading, fontWeight: '500', textAlign: 'center', lineHeight: 16 },
  upcomingScroll: { marginHorizontal: -spacing.md, paddingHorizontal: spacing.md },
  upcomingCardWrapper: {
    width: width * 0.88,
    borderRadius: 24,
    marginRight: 14,
    overflow: 'hidden',
    ...elevation.md,
  },
  upcomingCardGradient: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    position: 'relative',
  },
  cardNotch: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.white,
    right: 70,
  },
  cardNotchTop: { top: -14 },
  cardNotchBottom: { bottom: -14 },
  upcomingCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  upcomingDate: { color: colors.white, fontSize: 17, fontWeight: '500' },
  trainNumBadge: { alignItems: 'flex-end', justifyContent: 'center' },
  ticketIconStyle: { marginBottom: 2 },
  trainNumText: { color: colors.white, fontSize: 21, fontWeight: '700', letterSpacing: 0.5 },
  cardDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.22)', marginVertical: 11 },
  upcomingRouteRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  upcomingStationLeft: { color: colors.white, fontSize: 14.5, fontWeight: '500', letterSpacing: 0.2 },
  upcomingStationRight: { color: colors.white, fontSize: 14.5, fontWeight: '500', letterSpacing: 0.2, textAlign: 'right' },
  upcomingCardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reservedBadgeText: { color: '#a8f3b0', fontSize: 17, fontWeight: '700' },
  upcomingBtnsRow: { flexDirection: 'row', alignItems: 'center' },
  cardBtnPill: { 
    borderWidth: 1.5, 
    borderColor: colors.white, 
    borderRadius: 20, 
    paddingHorizontal: 14, 
    paddingVertical: 6, 
    marginLeft: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  cardBtnText: { color: colors.white, fontSize: 13, fontWeight: '500' },

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
