#!/usr/bin/python
import math

BLOCK_WIDTH = 200
HALF_STREET_WIDTH = 20
STREET_WIDTH = 2 * HALF_STREET_WIDTH

MAN_TO_ESPLANADE = 2500 # Distance from the center of the Man to the center of Esplanade
ESPLANADE_TO_A = 400    # Width of the block from Esplanade to A

MAN_TO_CENTER_CAMP = 2907
CENTER_CAMP = (0, MAN_TO_CENTER_CAMP)
CENTER_CAMP_RADIUS1 = 190
CENTER_CAMP_RADIUS2 = 330
CENTER_CAMP_RADIUS3 = (MAN_TO_ESPLANADE + HALF_STREET_WIDTH + ESPLANADE_TO_A
	+ 3 * (STREET_WIDTH + BLOCK_WIDTH) - MAN_TO_CENTER_CAMP)

CENTER_CAMP_FLARE_ANGLE = 30
FOUR_THIRTY_FLARE_ANGLE = 28
THREE_O_CLOCK_FLARE_ANGLE = 20
PLAZA_RADIUS = 125

def rotatePoint(radians, point):
	c = math.cos(radians)
	s = math.sin(radians)
	x, y = point
	return (x*c - y*s, x*s + y*c)

def rotatePoints(radians, points):
	c = math.cos(radians)
	s = math.sin(radians)
	return [(x*c - y*s, x*s + y*c) for x, y in points]

def radialRadians(radialIndex):
	return (radialIndex - 4) * math.pi / 24

def radialDegrees(radialIndex):
	return (radialIndex - 4) * 180.0 / 24

def genThreeOClock():
	r = MAN_TO_ESPLANADE - HALF_STREET_WIDTH
	radii = [r]

	r += STREET_WIDTH
	radii.append(r)
	r += ESPLANADE_TO_A
	radii.append(r)

	for street in 'BCDEFGHIJKL':
		r += STREET_WIDTH
		radii.append(r)
		r += BLOCK_WIDTH
		radii.append(r)

	r += STREET_WIDTH
	radii.append(r)

	y = HALF_STREET_WIDTH
	yy = y*y
	pointsL = []
	pointsR = []

	for r in radii:
		x = math.sqrt(r*r - yy)
		pointsR.append((x, y))
		pointsL.append((x, -y))

	return radii, pointsL, pointsR

class Path(object):
	def __init__(self):
		self.path3 = []
		self.path9 = []

	def moveto(self, point):
		x = int(round(point[0]))
		y = int(round(point[1]))
		self.path3.append('M {} {}'.format(x, y))
		self.path9.append('M -{} {}'.format(x, y))

	def lineto(self, point):
		x = int(round(point[0]))
		y = int(round(point[1]))
		self.path3.append('L {} {}'.format(x, y))
		self.path9.append('L -{} {}'.format(x, y))

	def arcto(self, endPoint, radius, sweep):
		x = int(round(endPoint[0]))
		y = int(round(endPoint[1]))
		self.path3.append('A {} {} 0 0 {} {} {}'.format(radius, radius, sweep, x, y))
		sweep = 0 if sweep else 1
		self.path9.append('A {} {} 0 0 {} -{} {}'.format(radius, radius, sweep, x, y))

	def closepath(self):
		self.path3.append('Z')
		self.path9.append('Z')

		print '<path d="{}" />'.format(' '.join(self.path3))
		print '<path d="{}" />'.format(' '.join(self.path9))

		self.path3 = []
		self.path9 = []

def circleXcircle(r1, c2, r2):
	#
	# This returns the points s1 and s2 where the circle with radius r1 centered at the Man
	# (i.e. at 0, 0) intersects the circle with radius r2 centered at point c2.
	#
	x2, y2 = c2

	# The below was derived from the general circle-circle intersection formulas derived at
	# http://2000clicks.com/mathhelp/GeometryConicSectionCircleIntersection.aspx
	# We can simplify those general formulas here since x1 and y1 are 0.

	dd = x2*x2 + y2*y2
	k = math.sqrt(((r1 + r2)**2 - dd) * (dd - (r1 - r2)**2))

	x2 = x2/2.0
	y2 = y2/2.0
	x2dd = x2/dd
	y2dd = y2/dd
	r1r2 = r1*r1 - r2*r2

	x2f = x2 + x2dd*r1r2
	y2f = y2 + y2dd*r1r2

	s1 = (x2f + k*y2dd, y2f - k*x2dd)
	s2 = (x2f - k*y2dd, y2f + k*x2dd)

	return s1, s2

def circleXcircleCC(r1, r2):
	#
	# This is a simplified version of circleXcircle for when the second circle is centered
	# at Center Camp. Thus x2 is 0. It's equivalent to circleXcircle(r1, CENTER_CAMP, r2)[0]
	#
	# The equation for y was derived was follows:
	# (1) Circle centered at the Man: x**2 + y**2 = r1**2
	# (2) Circle centered at (0, y2): x**2 + (y - y2)**2 = r2**2
	# (3) Rewrite equation (1) as x**2 = r1**2 - y**2 and substitute the right-hand side
	#     for x**2 in equation (2): r1**2 - y**2 + (y - y2)**2 = r2**2
	# (4) Simplify and solve for y: r1**2 - y**2 + y**2 - 2*y*y2 + y2**2 = r2**2
	#                            => r1**2 - r2**2 + y2**2 = 2*y*y2
	#                            => y = (r1**2 - r2**2 + y2**2) / (2*y2)
	y2 = MAN_TO_CENTER_CAMP

	y = float(r1*r1 - r2*r2 + y2*y2) / (2*y2)
	x = math.sqrt(r1*r1 - y*y)

	return x, y

def lineXcircle(p1, p2, c, r):
	#
	# This returns the points s1 and s2 where the line which passes through points p1 and p2
	# intersects the circle of radius r centered at point c.
	#
	x1, y1 = p1
	x2, y2 = p2
	cx, cy = c

	if abs(x2 - x1) < 1e-12:

		# The equation for a vertical line (where x1 == x2) is not of the form y = a + b*x.
		# It's just x = x1. So, substituting x1 for x in the equation for the circle,
		# (x - cx)**2 + (y - cy)**2 = r**2, and solving for y, we get the following:

		k = math.sqrt(r*r - (x1 - cx)**2)
		return (x1, cy + k), (x1, cy - k)

	# The equation for a non-vertical line is y = a + b*x where b is the slope (delta y / delta x)
	# and a is where the line crosses the y axis. The equation for a circle of radius r centered at
	# point c is (x - cx)**2 + (y - cy)**2 = r**2. Substituting a + b*x for y in this equation and
	# solving for x using the quadratic formula, we get the following:

	b = float(y2 - y1) / (x2 - x1)
	a = y1 - b*x1
	d = a - cy
	bb1 = b*b + 1
	cxbd = cx - b*d

	k = math.sqrt(r*r*bb1 - (b*cx + d)**2)

	x = (cxbd + k) / bb1
	s1 = (x, a + b*x)

	x = (cxbd - k) / bb1
	s2 = (x, a + b*x)

	return s1, s2

def flareLine(radius, point, angle):
	#
	# This returns the point where the line that passes through the input point
	# at the input angle (clockwise from the x axis) intersects the circle with
	# the input radius centered at the Man.
	#
	x1, y1 = point

	b = math.tan(math.radians(angle))
	a = y1 - b*x1
	bb1 = b*b + 1

	x = (math.sqrt(radius*radius*bb1 - a*a) - a*b) / bb1
	y = a + b*x

	return x, y

def flareFromPlaza(points, radii, radial, ring, toRing, angle):
	pointsL = points[radial][0]
	pointsR = points[radial][1]

	plazaCenter = (radii[ring] + HALF_STREET_WIDTH, 0)
	plazaCenter = rotatePoint(radialRadians(radial), plazaCenter)

	angle /= 2.0
	radialAngle = radialDegrees(radial)
	angle1 = radialAngle + angle
	angle2 = radialAngle - angle

	rings = xrange(toRing, ring + 1) if toRing < ring else xrange(ring + 1, toRing + 1)

	for i in rings:
		pointsL[i] = flareLine(radii[i], plazaCenter, angle1)
		pointsR[i] = flareLine(radii[i], plazaCenter, angle2)

def plazaPath1(path, p1, p2, p3, p4, r12, r34, z1, z2, zr):
	path.moveto(z1)
	path.arcto(z2, zr, 1)
	path.arcto(p2, r12, 1)
	path.lineto(p3)
	path.arcto(p4, r34, 0)
	path.closepath()

def plazaPath2(path, p1, p2, p3, p4, r12, r34, z1, z2, zr):
	path.moveto(p1)
	path.arcto(z1, r12, 1)
	path.arcto(z2, zr, 1)
	path.lineto(p3)
	path.arcto(p4, r34, 0)
	path.closepath()

def plazaPath3(path, p1, p2, p3, p4, r12, r34, z1, z2, zr):
	path.moveto(p1)
	path.arcto(p2, r12, 1)
	path.lineto(z1)
	path.arcto(z2, zr, 1)
	path.arcto(p4, r34, 0)
	path.closepath()

def plazaPath4(path, p1, p2, p3, p4, r12, r34, z1, z2, zr):
	path.moveto(p1)
	path.arcto(p2, r12, 1)
	path.lineto(p3)
	path.arcto(z1, r34, 0)
	path.arcto(z2, zr, 1)
	path.closepath()

def addCircle(center, radius, stroke=None, fill=None):
	cx, cy = center
	print '<circle cx="{}" cy="{}" r="{}"{}{} />'.format(
		int(round(cx)),
		int(round(cy)),
		radius,
		'' if stroke is None else ' stroke="{}"'.format(stroke),
		'' if fill is None else ' fill="{}"'.format(fill),
	)

def previousRadial(radial, ring):
	return radial - (1 if ring > 14 else 2)

def addPlaza(plazaHash, points, radii, radial, ring):
	pointsL = points[radial][0]
	pointsR = points[radial][1]

	plazaCenter = (radii[ring] + HALF_STREET_WIDTH, 0)
	plazaCenter = rotatePoint(radialRadians(radial), plazaCenter)

	i, j, k = ring - 1, ring + 1, ring + 2

	key1 = '{},{}'.format(radial, j)
	key2 = '{},{}'.format(previousRadial(radial, j), j)
	key3 = '{},{}'.format(previousRadial(radial, i), i)
	key4 = '{},{}'.format(radial, i)

	z32, z41 = circleXcircle(radii[ring], plazaCenter, PLAZA_RADIUS)
	s1, z31 = lineXcircle(pointsL[i], pointsL[ring], plazaCenter, PLAZA_RADIUS)
	s1, z42 = lineXcircle(pointsR[i], pointsR[ring], plazaCenter, PLAZA_RADIUS)

	z21, z12 = circleXcircle(radii[j], plazaCenter, PLAZA_RADIUS)
	z22, s2 = lineXcircle(pointsL[j], pointsL[k], plazaCenter, PLAZA_RADIUS)
	z11, s2 = lineXcircle(pointsR[j], pointsR[k], plazaCenter, PLAZA_RADIUS)

	plazaHash[key1] = (plazaPath1, z11, z12, PLAZA_RADIUS)
	plazaHash[key2] = (plazaPath2, z21, z22, PLAZA_RADIUS)
	plazaHash[key3] = (plazaPath3, z31, z32, PLAZA_RADIUS)
	plazaHash[key4] = (plazaPath4, z41, z42, PLAZA_RADIUS)

def main():
	radii, threeOClockL, threeOClockR = genThreeOClock()

	points = []
	for radial in xrange(18): # 0 thru 17 (every 15 minutes from 2:00 to 6:00 inclusive)
		radians = radialRadians(radial)
		pointsL = rotatePoints(radians, threeOClockL)
		pointsR = rotatePoints(radians, threeOClockR)
		points.append((pointsL, pointsR))

	flareFromPlaza(points, radii, 4, 4, 1, THREE_O_CLOCK_FLARE_ANGLE)
	flareFromPlaza(points, radii, 4, 4, 6, -THREE_O_CLOCK_FLARE_ANGLE)
	flareFromPlaza(points, radii, 10, 14, 16, -THREE_O_CLOCK_FLARE_ANGLE)

	pointsL = points[10][0]
	pointsR = points[10][1]

	pointsL[1] = flareLine(radii[1], pointsL[2], radialDegrees(10) + FOUR_THIRTY_FLARE_ANGLE/2)
	pointsR[1] = flareLine(radii[1], pointsR[2], radialDegrees(10) - FOUR_THIRTY_FLARE_ANGLE/2)

	print '<svg'
	print '\txmlns="http://www.w3.org/2000/svg"'
	print '\txmlns:xlink="http://www.w3.org/1999/xlink"'
	print '\twidth="900" height="900" viewBox="-6000 -6000 12000 12000">'
	print '<g fill="none" stroke="black" stroke-width="4" transform="rotate(45)">'

	quarterHourIndex = len('ABCDEFG') * 2 + 1
	wideBlockIndex = len('ABCDE') * 2 + 1
	path = Path()

	plazaHash = {}
	addPlaza(plazaHash, points, radii, 4, 4)
	addPlaza(plazaHash, points, radii, 4, 14)
	addPlaza(plazaHash, points, radii, 10, 14)
	addPlaza(plazaHash, points, radii, 16, 18)

	odd = True
	for n in xrange(16):
		odd = not odd

		if odd:
			m_start = quarterHourIndex
			n_right = n + 1
		else:
			m_start = 1
			n_right = n + 2

		pointsL = points[n][1]
		pointsR = points[n_right][0]

		isWide = n in (0, 6, 12, 14)

		for m in xrange(m_start, len(pointsL) - 1, 2):
			if m == quarterHourIndex:
				pointsR = points[n + 1][0]

			if n == 14 and m < 9:
				continue

			m_next = m + 1

			if isWide:
				if m == wideBlockIndex:
					m_next = m + 3
				elif m == wideBlockIndex + 2:
					continue

			p1, p2, r12 = pointsL[m], pointsR[m], radii[m]
			p3, p4, r34 = pointsR[m_next], pointsL[m_next], radii[m_next]

			key = '{},{}'.format(n, m)
			plaza = plazaHash.get(key)
			if plaza:
				makePath, z1, z2, zr = plaza
				makePath(path, p1, p2, p3, p4, r12, r34, z1, z2, zr)
			else:
				path.moveto(p1)
				path.arcto(p2, r12, 1)
				path.lineto(p3)
				path.arcto(p4, r34, 0)
				path.closepath()

	#---------- Center Camp - Bottom Half ----------#

	hs = HALF_STREET_WIDTH
	r2 = CENTER_CAMP_RADIUS2
	r3 = CENTER_CAMP_RADIUS3
	d2 = math.sqrt(r2*r2 - hs*hs)
	d3 = math.sqrt(r3*r3 - hs*hs)

	p1 = (d2, MAN_TO_CENTER_CAMP + hs)
	p2 = (hs, MAN_TO_CENTER_CAMP + d2)
	p3 = (hs, MAN_TO_CENTER_CAMP + d3)
	p4 = circleXcircleCC(radii[3], r3)

	path.moveto(p1)
	path.arcto(p2, r2, 1)
	path.lineto(p3)
	path.arcto(p4, r3, 0)
	path.closepath()

	#---------- Center Camp - Top Half ----------#

	a = math.radians(CENTER_CAMP_FLARE_ANGLE / 2)
	c = math.cos(a)
	s = math.sin(a)
	p1 = (r2 * s, MAN_TO_CENTER_CAMP - r2 * c)
	p4 = (r3 * s, MAN_TO_CENTER_CAMP - r3 * c)
	p2 = (d2, MAN_TO_CENTER_CAMP - hs)
	p3 = circleXcircleCC(radii[2], r3)

	path.moveto(p1)
	path.arcto(p2, r2, 1)
	path.lineto(p3)
	path.arcto(p4, r3, 0)
	path.closepath()

	#---------- Center Camp - Partial C-D Block ----------#

	r6 = radii[6]
	r7 = radii[7]
	r8 = radii[8]
	rc = CENTER_CAMP_RADIUS3 + STREET_WIDTH

	p1 = points[14][1][7]
	p2 = circleXcircleCC(r7, rc)
	p3 = circleXcircleCC(r8, rc)
	p4 = points[14][1][8]

	path.moveto(p1)
	path.arcto(p2, r7, 1)
	path.arcto(p3, rc, 1)
	path.arcto(p4, r8, 0)
	path.closepath()

	#---------- Center Camp - Partial A-C Block ----------#

	p3 = points[14][1][6]
	p1 = lineXcircle(points[14][1][3], p3, CENTER_CAMP, rc)[0]
	p2 = circleXcircleCC(r6, rc)

	path.moveto(p1)
	path.arcto(p2, rc, 1)
	path.arcto(p3, r6, 0)
	path.closepath()

	addCircle(CENTER_CAMP, CENTER_CAMP_RADIUS1)

	print '</g>'
	print '</svg>'

if __name__ == '__main__':
	main()
