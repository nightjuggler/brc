#!/usr/bin/python
import math
import sys

BLOCK_WIDTH = 200
HALF_STREET_WIDTH = 20
STREET_WIDTH = 2 * HALF_STREET_WIDTH

MAN_TO_ESPLANADE = 2500 # Distance from the center of the Man to the center of Esplanade
ESPLANADE_TO_A = 400    # Width of the block from Esplanade to A

MAN_TO_CENTER_CAMP = 2907
CENTER_CAMP_RADIUS1 = 190
CENTER_CAMP_RADIUS2 = 330
CENTER_CAMP_RADIUS3 = (MAN_TO_ESPLANADE + HALF_STREET_WIDTH + ESPLANADE_TO_A
	+ 3 * (STREET_WIDTH + BLOCK_WIDTH) - MAN_TO_CENTER_CAMP)

CENTER_CAMP_FLARE_ANGLE = 30
FOUR_THIRTY_FLARE_ANGLE = 28
THREE_O_CLOCK_FLARE_ANGLE = 20
PLAZA_RADIUS = 125

def rotate(radians, points):
	c = math.cos(radians)
	s = math.sin(radians)
	return [(x*c - y*s, x*s + y*c) for x, y in points]

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
	x2, y2 = c2

	# See http://2000clicks.com/mathhelp/GeometryConicSectionCircleIntersection.aspx

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

def circleIntersection(r1, r2):
#	return circleXcircle(r1, (0, MAN_TO_CENTER_CAMP), r2)[0]

	y2 = MAN_TO_CENTER_CAMP

	y = float(r1*r1 - r2*r2 + y2*y2) / (2*y2)
	x = math.sqrt(r1*r1 - y*y)

	return x, y

def lineXcircle(p1, p2, c, r):
	x1, y1 = p1
	x2, y2 = p2
	cx, cy = c

#	x1, y1 = int(round(x1)), int(round(y1))
#	x2, y2 = int(round(x2)), int(round(y2))
#	cx, cy = int(round(cx)), int(round(cy))

#	if x1 == x2:
	if abs(x2 - x1) < 1e-12:
		k = math.sqrt(r*r - (x1 - cx)**2)
		return (x1, cy + k), (x1, cy - k)

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

def lineIntersection(r, p1, p2):
#	return lineXcircle(p1, p2, (0, MAN_TO_CENTER_CAMP), r)[0]

	cy = MAN_TO_CENTER_CAMP
	x1, y1 = p1
	x2, y2 = p2

	b = float(y2 - y1) / (x2 - x1)
	a = y1 - b*x1
	d = a - cy
	bb1 = b*b + 1

	x = (math.sqrt(r*r*bb1 - d*d) - b*d) / bb1
	y = a + b*x

	return x, y

def flareLine(radius, point, angle):
	x1, y1 = point

	b = math.tan(math.radians(angle))
	a = y1 - b*x1

	x = (math.sqrt(radius*radius * (b*b + 1) - a*a) - a*b) / (b*b + 1)
	y = a + b*x

	return x, y

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

def nPrev(n, m):
	return n - (1 if m > 14 else 2)

def addPlaza(plazaHash, points, radii, n, j):
	pointsL = points[n][0]
	pointsR = points[n][1]

	plazaCenter = (radii[j] + HALF_STREET_WIDTH, 0)
	plazaCenter = rotate((n - 4) * math.pi / 24, [plazaCenter])[0]

	k1 = '{},{}'.format(n, j + 1)
	k2 = '{},{}'.format(nPrev(n, j + 1), j + 1)
	k3 = '{},{}'.format(nPrev(n, j - 1), j - 1)
	k4 = '{},{}'.format(n, j - 1)

	i = j - 1

	z32, z41 = circleXcircle(radii[j], plazaCenter, PLAZA_RADIUS)
	s1, z31 = lineXcircle(pointsL[i], pointsL[j], plazaCenter, PLAZA_RADIUS)
	s1, z42 = lineXcircle(pointsR[i], pointsR[j], plazaCenter, PLAZA_RADIUS)

	i, j = j + 1, j + 2

	z21, z12 = circleXcircle(radii[i], plazaCenter, PLAZA_RADIUS)
	z22, s2 = lineXcircle(pointsL[i], pointsL[j], plazaCenter, PLAZA_RADIUS)
	z11, s2 = lineXcircle(pointsR[i], pointsR[j], plazaCenter, PLAZA_RADIUS)

#	addCircle(plazaCenter, PLAZA_RADIUS, "blue")
#	addCircle(z32, 8, "red", "red")
#	addCircle(z41, 8, "green", "green")
#	addCircle(z31, 8, "green", "green")
#	addCircle(z42, 8, "green", "green")
#	addCircle(z21, 8, "red", "red")
#	addCircle(z12, 8, "green", "green")
#	addCircle(z22, 8, "red", "red")
#	addCircle(z11, 8, "red", "red")

	plazaHash[k1] = (plazaPath1, z11, z12, PLAZA_RADIUS)
	plazaHash[k2] = (plazaPath2, z21, z22, PLAZA_RADIUS)
	plazaHash[k3] = (plazaPath3, z31, z32, PLAZA_RADIUS)
	plazaHash[k4] = (plazaPath4, z41, z42, PLAZA_RADIUS)

def genPoints():
	radii, threeOClockL, threeOClockR = genThreeOClock()

	points = []
	for n in xrange(-4, 12 + 1):
		radians = n * math.pi / 24
		pointsL = rotate(radians, threeOClockL)
		pointsR = rotate(radians, threeOClockR)
		points.append((pointsL, pointsR))

	plazaCenter = (radii[4] + HALF_STREET_WIDTH, 0)

	points[4][0][1] = flareLine(radii[1], plazaCenter, THREE_O_CLOCK_FLARE_ANGLE/2)
	points[4][1][1] = flareLine(radii[1], plazaCenter, -THREE_O_CLOCK_FLARE_ANGLE/2)

	points[4][0][2] = flareLine(radii[2], plazaCenter, THREE_O_CLOCK_FLARE_ANGLE/2)
	points[4][1][2] = flareLine(radii[2], plazaCenter, -THREE_O_CLOCK_FLARE_ANGLE/2)

	points[4][0][3] = flareLine(radii[3], plazaCenter, THREE_O_CLOCK_FLARE_ANGLE/2)
	points[4][1][3] = flareLine(radii[3], plazaCenter, -THREE_O_CLOCK_FLARE_ANGLE/2)

	points[10][0][1] = flareLine(radii[1], points[10][0][2], 180*(10-4)/24 + FOUR_THIRTY_FLARE_ANGLE/2)
	points[10][1][1] = flareLine(radii[1], points[10][1][2], 180*(10-4)/24 - FOUR_THIRTY_FLARE_ANGLE/2)

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
	p4 = circleIntersection(radii[3], r3)

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
	p3 = circleIntersection(radii[2], r3)

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
	p2 = circleIntersection(r7, rc)
	p3 = circleIntersection(r8, rc)
	p4 = points[14][1][8]

	path.moveto(p1)
	path.arcto(p2, r7, 1)
	path.arcto(p3, rc, 1)
	path.arcto(p4, r8, 0)
	path.closepath()

	#---------- Center Camp - Partial A-C Block ----------#

	p3 = points[14][1][6]
	p1 = lineIntersection(rc, points[14][1][3], p3)
	p2 = circleIntersection(r6, rc)

	path.moveto(p1)
	path.arcto(p2, rc, 1)
	path.arcto(p3, r6, 0)
	path.closepath()

	addCircle((0, MAN_TO_CENTER_CAMP), CENTER_CAMP_RADIUS1)
#	addCircle((0, MAN_TO_CENTER_CAMP), CENTER_CAMP_RADIUS2, "red")
#	addCircle((0, MAN_TO_CENTER_CAMP), CENTER_CAMP_RADIUS3, "blue")

	print '</g>'
	print '</svg>'

if __name__ == '__main__':
	genPoints()
