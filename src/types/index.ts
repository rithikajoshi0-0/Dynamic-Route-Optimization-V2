// Core types for the route optimization system
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  createdAt: Date;
}

export interface LatLng {
  lat: number;
  lng: number;
}

export interface Place {
  id: string;
  name: string;
  address: string;
  location: LatLng;
  placeId?: string;
}

export interface Node {
  id: string;
  name: string;
  location: LatLng;
  address?: string;
  placeId?: string;
  type: 'city' | 'landmark' | 'junction';
}

export interface Edge {
  id: string;
  from: string;
  to: string;
  distance: number;
  duration: number;
  roadType: 'highway' | 'street' | 'alley';
  baseWeight: number;
  currentWeight: number;
  isBlocked: boolean;
  trafficLevel: 'low' | 'medium' | 'high';
  polyline?: string;
}

export interface Graph {
  nodes: Node[];
  edges: Edge[];
  adjacencyList: Map<string, Edge[]>;
}

export interface Route {
  id: string;
  userId: string;
  startNode: string;
  endNode: string;
  startPlace?: Place;
  endPlace?: Place;
  algorithm: 'dijkstra' | 'astar' | 'bellman-ford';
  path: string[];
  totalDistance: number;
  estimatedTime: number;
  polyline?: string;
  createdAt: Date;
  isFavorite: boolean;
}

export interface PathResult {
  path: string[];
  totalDistance: number;
  estimatedTime: number;
  visitedNodes: string[];
  algorithm: string;
  polyline?: string;
  directions?: google.maps.DirectionsResult;
}

export interface TrafficUpdate {
  edgeId: string;
  newWeight: number;
  trafficLevel: 'low' | 'medium' | 'high';
  timestamp: Date;
}

export interface Analytics {
  totalRoutes: number;
  algorithmUsage: Record<string, number>;
  mostCongestedPaths: Array<{ path: string; congestionLevel: number }>;
  activeUsers: number;
  peakHours: number[];
}